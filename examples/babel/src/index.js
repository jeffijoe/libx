/**
 * This example illustrates full usage of LibX, how it ensures we only
 * have a single source of truth for our data by using stores and collections of models.
 */

import { Store, Model, createRootStore } from '../../../lib'
import { observable, computed } from 'mobx'
import assert from 'assert'
import moment from 'moment'
import { API } from './api'

// ---------------------------
// Todos
// ---------------------------

// One part of the magic puzzle is "Models".
// It gives us a way to transform dumb JSON (JS objects) to a meaningful model.
class Todo extends Model {
  @observable text
  @observable completed = false
  @observable creatorId = null
  @observable createdAt

  @computed
  get creator() {
    return this.rootStore.userStore.users.referenceOne(this.creatorId)
  }

  // Override `parse` to customize how we transform external JSON to
  // properties for this model.
  parse(json) {
    // We want to set the `creator` ourselves, so slice it out of
    // the `json`.
    const { creator, ...rest } = json
    // Set the user in the user store, get a User (or undefined) back.
    // When created through a Store collection, models have access
    // to the Root Store.
    this.rootStore.userStore.users.set(creator)
    return {
      // All fields except `creator`.
      ...rest,
      // Assign the creator ID so we can look it up.
      creatorId: creator._id,
      // We want all our dates as `Moment`s.
      createdAt: moment(json.createdAt),
    }
  }
}

class TodoStore extends Store {
  todos = this.collection({ model: Todo })

  fetchTodos() {
    // Fetch the todos, then load them into the collection.
    return API.getTodos().then((todos) => this.todos.set(todos))
  }
}

// ---------------------------
// Users
// ---------------------------
class User extends Model {
  @observable name
  @observable twitterHandle

  @computed
  get todos() {
    return this.rootStore.todoStore.todos.referenceMany(this._id, 'creatorId')
  }
}

class UserStore extends Store {
  users = this.collection({
    model: User,
    idAttribute: '_id', // just to demo how we actually use the ID.
  })

  fetchUser(id) {
    return API.getUser(id).then(this.users.set)
  }
}

// ---------------------------
// Root store - aka the glue.
// See the TypeScript example for a different approach.
// ---------------------------
const root = createRootStore({
  todoStore: TodoStore,
  userStore: UserStore,
})

// ---------------------------
// Lets go!
// ---------------------------

const { todoStore, userStore } = root

todoStore
  .fetchTodos()
  .then((todos) => {
    const [, todo] = todos
    assert(todos.length === 3)
    assert(todo instanceof Todo)
    // Even though we had 3 todos and each item included their creator,
    // we only see 2 users because they had the same ID.
    assert(userStore.users.length === 2)
    assert(todo.creator instanceof User)
    assert(todo.creator._id === 2)
    assert(todo.creator.twitterHandle === undefined) // we don't have this yet.

    return userStore.fetchUser(2).then((user) => {
      assert(user === todo.creator) // Same instance, woah!
      assert(user.twitterHandle === 'jeffijoe')

      console.log('Todo:', todo.text)
      console.log('Todo created', todo.createdAt.fromNow())
      console.log('Todo creator twitter handle:', todo.creator.twitterHandle)
      console.log(
        'Todo creator todos:',
        `[${todo.creator.todos.map((x) => `"${x.text}"`).join(', ')}]`,
      )
      console.log('-------------')
      console.log('So long, and thanks for all the fish!')
    })
  })
  .catch((err) => {
    console.error(err)
  })
