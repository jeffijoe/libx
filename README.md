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

# Why?

Maintaining large application state is hard. Maintaining single references to entities for a single source of truth is 
hard. But it doesn't have to be.

**LibX** is inspired by [Backbone](https://github.com/jashkenas/backbone)'s notion of Collections and Models, and makes it sexy by using [MobX](https://github.com/mobxjs/mobx) to manage state,
instead of using events.

**TL;DR:** Maintaining only a single instance of a model is a chore. With LibX, it's not.

# Examples

See the [TypeScript example][ts-example] and [Babel example][babel-example] for runnable examples (in Node).

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

# Step 2 : the `TodoStore` and `Todo` model

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

# Step 3: the `UserStore` and `User` model

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

# Step 4: the UI

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

# API

Coming sooner or later - until then, feel free to inspect the examples and source code.

# Author

Jeff Hansen - [@Jeffijoe](https://twitter.com/Jeffijoe)

[ts-example]: /examples/typescript
[babel-example]: /examples/babel
