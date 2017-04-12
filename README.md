# libx

[![npm](https://img.shields.io/npm/v/libx.svg?maxAge=1000)](https://www.npmjs.com/package/libx)
[![dependency Status](https://img.shields.io/david/jeffijoe/libx.svg?maxAge=1000)](https://david-dm.org/jeffijoe/libx)
[![devDependency Status](https://img.shields.io/david/dev/jeffijoe/libx.svg?maxAge=1000)](https://david-dm.org/jeffijoe/libx)
[![Build Status](https://img.shields.io/travis/jeffijoe/libx.svg?maxAge=1000)](https://travis-ci.org/jeffijoe/libx)
[![Coveralls](https://img.shields.io/coveralls/jeffijoe/libx.svg?maxAge=1000)](https://coveralls.io/github/jeffijoe/libx)
[![npm](https://img.shields.io/npm/dt/libx.svg?maxAge=1000)](https://www.npmjs.com/package/libx)
[![npm](https://img.shields.io/npm/l/libx.svg?maxAge=1000)](https://github.com/jeffijoe/libx/blob/master/LICENSE.md)
[![node](https://img.shields.io/node/v/libx.svg?maxAge=1000)](https://www.npmjs.com/package/libx)

Collection + Model infrastructure for [MobX](https://github.com/mobxjs/mobx) applications. Written in [TypeScript](https://github.com/Microsoft/TypeScript).

## Install

```
npm install --save libx
```

# Table of Contents

* [Why?](#why)
* [Examples](#examples)
* [Concepts](#concepts)
   * [The Root Store](#the-root-store)
   * [Store](#store)
   * [Collection](#collection)
   * [Model](#model)
* [Let's build an app!](#lets-build-an-app)
   * [Step 1: the Root Store](#step-1-the-root-store)
   * [Step 2: the TodoStore and <code>Todo</code> model](#step-2-the-todostore-and-todo-model)
   * [Step 3: the UserStore and <code>User</code> model](#step-3-the-userstore-and-user-model)
   * [Step 4: the UI](#step-4-the-ui)
* [API documentation](#api-documentation)
   * [collection([opts])](#collectionopts)
      * [Collection object](#collection-object)
      * [collection.items](#collectionitems)
      * [collection.length](#collectionlength)
      * [collection.add(models)](#collectionaddmodels)
      * [collection.create(data, [opts])](#collectioncreatedata-opts)
      * [collection.get(id)](#collectiongetid)
      * [collection.set(data, [opts])](#collectionsetdata-opts)
      * [collection.clear()](#collectionclear)
      * [collection.remove(modelOrId)](#collectionremovemodelorid)
      * [LoDash methods](#lodash-methods)
   * [The Model class](#the-model-class)
      * [constructor (attributes, opts)](#constructor-attributes-opts)
      * [rootStore](#rootstore)
      * [set (attributes, opts)](#set-attributes-opts)
      * [parse (attributes, opts)](#parse-attributes-opts)
      * [pick (properties)](#pick-properties)
   * [The Store class](#the-store-class)
      * [store.collection(opts)](#storecollectionopts)
   * [createRootStore(obj)](#createrootstoreobj)
* [See Also](#see-also)
* [Author](#author)

# Why?

Maintaining large application state is hard. Maintaining single references to entities for a single source of truth is 
hard. But it doesn't have to be.

**LibX** is inspired by [Backbone](https://github.com/jashkenas/backbone)'s notion of Collections and Models, and makes it sexy by using [MobX](https://github.com/mobxjs/mobx) to manage state,
instead of using events.

**TL;DR:** Maintaining only a single instance of a model is a chore. With LibX, it's not.

# Examples

See the [TypeScript example][ts-example] and [Babel example][babel-example] for runnable examples (in Node).

# Concepts

LibX concepts are similar to those of Backbone: **Models** and **Collections** are used to represent your domain data. LibX also adds the Flux concept of **Stores**.

## The Root Store

Just a fancy name for an object (or instance of a class) that references all your stores. Yes, it will work with Server Side Rendering, too. A root
store is by no means required to build apps with LibX - it's just convenient.

**Example:**

```js
import TodoStore from './TodoStore'
import UserStore from './UserStore'

class RootStore {
  constructor () {
    this.userStore = new UserStore({ rootStore: this })
    this.todoStore = new TodoStore({ rootStore: this })
  }
}
```

## Store

A store maintains "top-level" state, like collections, and _whether or not some sidebar is visible_.

It also contains **actions**: a means of mutating state. While not required, it is recommended that all actions and logic is implemented in stores.

**Example:**

```js
import { action } from 'mobx'
import { Store } from 'libx'
import Todo from '../models/Todo'

export default class TodoStore extends Store {
  todos = this.collection({
    model: Todo
  })
  
  @action createTodo (text) {
    return http.post('/todos', {
      text: text
    }).then((data) => {
      this.todos.set(data)
    })
  }
  
  @action toggle (todo) {
    const completed = !todo.completed
    todo.set({ completed: completed })
    return http.patch('/todos/' + todo.id, {
      completed: todo.completed
    })
      // this will update the todo model, because it's already
      // in the collection with the same ID.
      .then(this.todos.set) 
  }
}
```

## Collection

Maintains a collection of models, making sure we only have a single instance of an entity in memory. That way, updates to an entity will propagate to the entire system without us having to do anything at all.

**Example:** see the [`Store`](#store) example.

## Model

Represents a concept of your own domain, like a `User`, a `Todo`, a `Product` or whatever your domain deals with.

Models usually have observable and computed properties, and no actions other than the built-in `set()`. If you want to, you can give your models actions, but it is recommended to keep all actions in the stores.

**Example:**

```js
import { observable } from 'mobx'
import { Model } from 'libx'

export default class Todo extends Model {
  @observable text = ''
  @observable completed = false
}
```

# Let's build an app!

This section is mostly going to break down the Babel example for easier digestion. :smile:

We are building a Todo app - _how original_ - but there's a twist:
Each `Todo` has a `creator`, which is a `User`. It's like erhh, let's say _"Todos for Teams"_, hehe...

So that means we have 2 entities in our system: `Todo` and `User`. But more on those later.

**Note:** basic knowledge of MobX and Promises will help.

## Step 1: the Root Store

To make it easier for your application parts to communicate, we need some glue. In LibX,
that glue is called the **Root Store**.

_The root store is by no means required to use parts of LibX (Models, Collections), but it greatly
simplifies writing applications._

Features of the root store:

- References all the other stores
- Only a single instance per session.

By using the root store pattern instead of singleton stores, you can do server-side rendering
pretty easily.

Let's create our root store.

```js
class RootStore {
  constructor () {
    // We're gonna need 3 stores.
    // Each store wants a reference to the root store
    // so they can talk to each other, as well as pass it
    // along to our `Todo` and `User` instances.
    this.todoStore = new TodoStore({ rootStore: this })
    this.userStore = new UserStore({ rootStore: this })
    // used for UI state
    this.todosScreenStore = new TodosScreenStore({ rootStore: this })
  }
}

// And we're ready!
const rootStore = new RootStore()
```

There's no rocket science there, so if you want to type less, you can use `createRootStore`.

```js
import { createRootStore } from 'libx'

// if using Server Side Rendering, do this once per request.
const rootStore = createRootStore({
  todoStore: TodoStore,
  userStore: UserStore,
  // used for UI state
  todosScreenStore: TodosScreenStore 
})
```

That was the root store. Now let's implement the `TodoStore`.

## Step 2: the `TodoStore` and `Todo` model

A Store in LibX is just a glorified state container. It can contain your data, UI state, whatever. However the
most common case is to store a collection of models.

Let's implement the `TodoStore`.

```js
import { Store } from 'libx'

class TodoStore extends Store {
  // This is the most powerful part of LibX: Models and Collections.
  // Whenever a `Todo` model is created, the `rootStore` is passed to it.
  todos = this.collection({
    // Whenever we try to add stuff to this collection,
    // transform it to a Todo model.
    model: Todo
  })
  
  // Fetch todos from our server.
  fetchTodos () {
    return fetch('/api/todos')
        .then(r => r.json())
        // `set` is a MobX action, no need to wrap it. 
        // Also, it does not care about `this` context.
        .then(this.todos.set) 
  }
  
  addNewTodo (text) {
    return fetch('/api/todos', {
      method: 'post',
      body: JSON.stringify({
        text
      })
    })
    .then(r => r.json())
    .then(this.todos.set) // resolves to a Todo model. 
  }
  
  toggleCompleted (id, completed) {
    return fetch(`/api/todos/${id}`, {
      method: 'patch',
      body: JSON.stringify({
        completed
      })
    })
    .then(r => r.json())
    // resolves to our existing Todo model, because
    // when `set` is called, it recognizes the `id` and sets
    // the new values on the existing todo. Magical!
    .then(this.todos.set)  
  }
}
```

Notice that whenever we needed to update our todos state, we just
called `this.todos.set(someObjectOrArray)` and LibX automagically adds and updates
the models.

Now to the `Todo` model.

```js
import { Model } from 'libx'
import { observable } from 'mobx'
import moment from 'moment' // just to show off, hehe

class Todo extends Model {
  @observable id
  @observable text = ''
  @observable completed = false
  @observable creator // the user that created this todo
  @observable createdAt
  
  parse (json) {
    // Let's imagine the API response looks like
    // {
    //   "id": 1,
    //   "text": "Buy milk"
    //   "completed": false,
    //   "createdAt": "2017-20-02T14:45:12Z",
    //   "creator": {
    //     "_id": "abcd",
    //     "name": "Jeff Hansen"
    //   }
    // }
    
    // Set the user in the user store, get a User (or undefined) back.
    // When created through a Store collection, models have access
    // to the Root Store!
    const creator = this.rootStore.userStore.users.set(json.creator)
    return {
      ...json,
      // We want all our dates as `Moment`s.
      createdAt: moment(json.createdAt),
      // Set it on the todo. Now we have a reference to the user model!
      creator
    }
  }
}
```

We leveraged the fact that we can communicate with the user store, and
`parse` is called whenever we try to `set` some JSON in the collection.

Under the hood, the collection does this for new items:

```js
// call the parse function before setting on the model
new Todo(data, { parse: true, rootStore: rootStore })
```

And for existing items:

```js
// call the parse function before setting on the model
todo.set(data, { parse: true })
```

## Step 3: the `UserStore` and `User` model

Same as the Todo store, except if you paid attention to the JSON example,
you might have noticed that users have an `_id` attribute instead of the conventional `id`.
This is not a problem at all, we just need to tell the collection what ID to look at.

```js
import { Store } from 'libx'

class UserStore extends Store {
  users = this.collection({
    model: User,
    idAttribute: '_id' // easy - to the pub!
  })
}
```

Since we don't deal with any user API, that's all we need. But even if we did, 
it would follow the same formula as the Todo store.

On to the `User` model!

```js
import { Model } from 'libx'

class User extends Model {
  @observable _id
  @observable name
}
```

Since we don't do any fancy parsing, that's all we need!

## Step 4: the UI

Like with MobX, you can use any UI library you want. I like React, so I'll use that.

Firstly, I want to implement the `TodosScreenStore` - our UI state.

```js
import { Store } from 'libx'
import { observable, action, computed } from 'mobx'

// Most of this is plain MobX.
class TodosScreenStore extends Store {
  @observable loading = false
  @observable filter = 'ALL'
  @observable text = ''
  
  @computed get todos () {
    // Stores have access to the root store.
    const { todoStore } = this.rootStore
    const { todos } = todoStore
    // Fun fact: collections implement a few Lodash functions,
    // like `filter`, `map` and more.
    switch (this.filter) {
      case 'COMPLETED': return todos.filter(x => x.completed)
      case 'INCOMPLETE': return todos.filter(x => !x.completed)
      default: return todos.slice() // coerce to array
    }
  }
  
  @action setText (text) {
    this.text = text
  }
  
  @action setLoading (loading) {
    this.loading = loading
  }
  
  @action setFilter (filter) {
    this.filter = filter
  }
  
  // Called by the UI whenever it wants to activate
  // this state from scratch.
  activate () {
    this.setLoading(true)
    this.setText('') // clear the text on activate.
    this.rootStore.todoStore.fetchTodos()
      .then(() => this.setLoading(false))
  }
  
  addTodo () {
    const text = this.text
    this.setText('') // clear the text
    return this.rootStore.todoStore.addNewTodo(text)
  }
  
  toggle (todo) {
    this.rootStore.todoStore.toggleCompleted(todo.id, !todo.completed)
  }
}
```

That's it for the `TodosScreenStore` - our UI state.

Now for the React part.

```jsx
import React from 'react'
import { render } from 'react-dom'
import { observer } from 'mobx-react'

@observer
class TodosApp extends React.Component {
  get store () {
    return this.props.rootStore.todosScreenStore
  }
    
  componentWillMount () {
    this.store.activate()
  }
  
  render () {
    if (this.store.loading) {
      return <div>Loading todos, please hold...</div>
    }

    return (
      <div>
        <input 
          type="text" 
          value={this.store.text} 
          placeholder="What needs to be done?"
          onChange={e => this.store.setText(e.target.value)}
        />
        <button onClick={() => this.store.addTodo()}>Add</button>
        <ul>
          {this.store.todos.map(todo =>
            <li key={todo.id} onClick={() => this.store.toggle(todo)}>
              <p>          
                {todo.text}
                {todo.completed &&
                  <span> (COMPLETED)</span>
                }
              </p>
              <p>- created by {todo.creator.name}</p>
            </li>
          )}
        </ul>
        <select value={this.store.filter} onChange={e => this.store.setFilter(e.target.value)}>
          <option value="ALL">All</option>
          <option value="COMPLETED">Completed</option>
          <option value="INCOMPLETE">Incomplete</option>
        </select>
      </div>
    )
  }
}

render(
  // Get the root store reference from somewhere.
  <TodosApp rootStore={rootStore} />,
  document.body
)
```

And that concludes our guide. All that's left is to slap some Stripe integration on it
and make millions. You're welcome.

# API documentation

This is documentation for the exported modules.

```js
import { collection, Model, Store, createRootStore } from 'libx'
```

## `collection([opts])`

Creates a collection with the given options. The collection ensures no duplicate objects 
are inserted based on an identification field and a bit of config.

The `collection` function is used internally by `Store.collection` (which provides 
aforementioned config), and can be used with plain objects. If you wish to use it 
stand-alone, go right ahead.

**Params:**

- `opts.idAttribute` - defaults to `"id"`, the property used to determine whether to insert or update an item using the default `getModelId` and `getDataId`.
- `opts.create` - function used to transform the input object to something else. Defaults to a function that just returns the input.
  - Signature: `(data, opts) => stuffToAddToCollection`, with `opts` being the collection options.
- `opts.update` - function used to merge input onto an existing object. Defaults to `(existing, input) => Object.assign(existing, input)`
  - Signature: `(existing, data, opts) => void`, with `opts` being the collection options.
- `opts.getModelId` - function used to get the ID from an existing object in the collection. Defaults to `(model) => model[idAttribute]`.
- `opts.getDataId` - function used to get the ID from a raw object wanting to join the collection. Defaults to `(data) => data[idAttribute]`.

**Example:**

```js
// Example todo "model" not using LibX's Model class.
function todo (props) {
  const self = observable({
    text: '',
    completed: false,
    ...props,
    set: (data) => Object.assign(self, data),
    toggle: () => {
      self.completed = !self.completed
    }
  })
  
  return self
}

const todos = collection({
  create: todo,
  update: (existing, data) => existing.set(data)
})

// Add an item
const todo1 = todos.set({ 
  // id = the magic sauce that makes it work
  id: 1,
  text: 'Install LibX',
  completed: false
})

// Add the same item again, just updates the current one
const todo1Instance2 = todos.set({ 
  id: 1,
  text: 'Install LibX and follow @jeffijoe on Twitter'
})

console.log(todo1 === todo1Instance2) // true
console.log(todo1.text) // "Install LibX and follow @jeffijoe on Twitter"
console.log(todo1.completed) // false
todo1Instance2.toggle() // it's the same instance!
console.log(todo1.completed) // true

// Add multiple items
todos.set([{ 
  id: 1
}, {
  id: 2,
  text: 'Build a great app'
}, {
  id: 3,
  text: 'Profit'
}])

console.log(todos.length) // 3, because the first was updated
```

### Collection object

The object returned from `collection()` has the following properties and functions.

**Note:** All functions accepting an `opts` will have the collection's options merged into them when calling functions like `create`, `update`, `getModelId` and `getDataId`.

### `collection.items`

A MobX observable array of items.

### `collection.length`

Getter that returns the length of the `items` array.

### `collection.add(models)`

Adds one or more models to the end of collection (**does not call `create`**). No updating is
done here, existing models (based on referential equality) are not added again.

Supports 2 variants: `add(model)` and `add([model1, model2])`.

**Returns:** the collection.

### `collection.create(data, [opts])`

Like `set`, but will add regardless of whether an id is present or not.
This has the added risk of resulting multiple model instances if you don't make sure
to update the existing model once you do have an id. The model id is what makes the whole
one-instance-per-entity work.

Supports 2 variants: `create(obj)` and `create([obj1, obj2])`.

### `collection.get(id)`

Gets items by ids. Supports 2 variants:

- `collection.get(id)` - returns the found model, or undefined.
- `collection.get([id1, id2])` - returns an array of found models. If a model isn't found, it is set to `undefined` in the result array (as in `[model1, undefined, model3]`).

Internally uses `getModelId`.

### `collection.set(data, [opts])`

Given an object or an array of objects, intelligently adds or updates models.

If a model representing the given input exists in the collection 
(_based on `getDataId` and `getModelId`_), the `update` is called. If not, the 
`create` function is called and the result is added to the internal `items` array.

**Returns:** the added/existing model(s), same style as `collection.get`.

### `collection.clear()`

Clears the internal `items` array.

### `collection.remove(modelOrId)`

Removes a model based on ID or the model itself.

**Returns:** the collection.

### LoDash methods

The following [LoDash][lodash] array methods are available (and TS-typed) on the collection:

- `map`
- `reduce`
- `filter`
- `some`
- `every`
- `find`
- `slice`
- `chunk`
- `orderBy`

## The `Model` class

If you don't mind using ES6 classes, extend from this. It provides some nice things, such as...

### constructor (attributes, opts)

Calls `Model.set` with the attributes and options, and also sets the `rootStore` on the model if it's passed in.

**Params:**

- `attributes` - an object that will get assigned onto the model using ´set`.
- `opts` - model options. These are passed to the initial `set` as well.
- `opts.parse` - if true, calls `this.parse(attributes, opts)` and assigns the result to the model.
- `opts.stripUndefined` - if true, strips out any undefined values before assigning to the model.
- `opts.rootStore` - if set, will be assigned to the model.

### `rootStore`

A convenient reference to the root store (if it was passed to the constructor opts)

### `set (attributes, opts)`

Assigns the attributes to the model instance. 

If `opts.parse` is `true`, calls `this.parse(attributes, opts)` and assigns the result onto the object.

If `opts.stripUndefined` is `true`, removes all undefined values from the result.

**Params:** same as `constructor`.

**Returns:** the model instance.

**Example:** transform data before assignment using `parse`

```js
class Todo extends Model {
  parse (attributes, opts) {
    return {
      ...attributes,
      completedAt: moment(attributes.completedAt)
    }
  }
}

const todo = new Todo({ text: 'Install LibX' })

todo.set({
  completed: true,
  completedAt: '2017-02-29T12:00:00Z'
}, {
  parse: true
})
```

**Example:** strip out undefined values

```js
const todo = new Todo({ 
  text: 'Install LibX'
})

todo.set({
  text: undefined
}, { 
  stripUndefined: true 
})

console.log(todo.text) // "Install LibX"
```

### `parse (attributes, opts)`

Called by `set` when `parse: true` is passed to it. Gives the model a chance to massage the data into something it wants to work it. Commonly used to transform embedded data (denormalized) into references (normalized).

**Example:** normalization

Imagine there being a root store + a user store.

```js
class Todo extends Model {
  parse (attributes, opts) {
    // The attributes has a `creator` object, we want to normalize it.
    const creator = this.rootStore.userStore.users.set(attributes.creator)
    return {
      ...attributes,
      creator
    }
  }
}

const todo = new Todo({
  text: 'Install MobX',
  creator: {
    id: 1,
    name: 'Jeff Hansen'
  }
}, {
  parse: true
})
```

### `pick (properties)`

Picks the properties on the model. Basically LoDash's `_.pick(this, properties)`

## The `Store` class

If you don't mind using ES6 classes, you'll get a lot by using the `Store` as a base class for your stores:

- it sets a reference to the `rootStore`
- it has a nice `collection()` function.

### `store.collection(opts)`

Creates a [`collection`](#collection-object), but configured for use with
a [`Model`](#the-model-class). It also passes in the store's `rootStore` reference to any created models.

**Params:**

- `opts` - options passed to `collection(opts)`
- `opts.model` - class to instantiate for new models
- `opts.stripUndefined` - default is now `true`
- `opts.parse` - default is now `true`

**Returns:** a collection.

**Example:**

```js
class TodoStore extends Store {
  // ES7 property initializer
  todos = this.collection({
    model: Todo,
    stripUndefined: false
  })
}

const root = { awesome: true }
const store = new TodoStore({ rootStore: root })
const todo = store.todos.set({ id: 1, text: 'Install LibX' })

console.log(todo instanceof Todo) // true
console.log(todo.rootStore.awesome) // true
```

## `createRootStore(obj)`

Easiest way to create a simple root store. A root store, as described earlier, isn't that magical; it's just an object that holds references to all other stores.

**Params:**

- `obj` - example: `{ userStore: UserStore }`

**Returns:** the root store object.

**Example:**

```js
class UserStore extends Store { ... }

class TodoStore extends Store { ... }

const rootStore = createRootStore({
  userStore: UserStore,
  todoStore: TodoStore
})

console.log(rootStore.userStore instanceof UserStore) // true
```

# See Also

- [validx][validx] - MobX validation library
- [mobx-task][mobx-task] - Async operation state management

# Author

Jeff Hansen - [@Jeffijoe](https://twitter.com/Jeffijoe)

[ts-example]: /examples/typescript
[babel-example]: /examples/babel
[lodash]: https://lodash.com
[validx]: https://github.com/jeffijoe/validx
[mobx-task]: https://github.com/jeffijoe/mobx-task
