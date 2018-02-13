/**
 * This example illustrates full usage of LibX, how it ensures we only
 * have a single source of truth for our data by using stores and collections of models.
 */

import { Store, Model, createRootStore } from '../../../lib'
import { observable } from 'mobx'
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
  @observable creator
  @observable createdAt

  // Override `parse` to customize how we transform external JSON to
  // properties for this model.
  parse(json) {
    // We have a separate store for users, so
    // we set it there.
    const creator = this.rootStore.userStore.users.set(json.creator)
    return {
      ...json,
      // We want our dates as moments.
      createdAt: moment(json.createdAt),
      creator
    }
  }
}

class TodoStore extends Store {
  todos = this.collection({ model: Todo })

  fetchTodos() {
    // Fetch the todos, then load them into the collection.
    return API.getTodos().then(todos => this.todos.set(todos))
  }
}

// ---------------------------
// Users
// ---------------------------
class User extends Model {
  @observable name
  @observable twitterHandle
}

class UserStore extends Store {
  users = this.collection({
    model: User,
    idAttribute: '_id' // just to demo how we actually use the ID.
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
  userStore: UserStore
})

// ---------------------------
// Lets go!
// ---------------------------

const { todoStore, userStore } = root

todoStore.fetchTodos().then(todos => {
  const [todo] = todos
  assert(todos.length === 3)
  assert(todo instanceof Todo)
  // Even though we had 3 todos and each item included their creator,
  // we only see 2 users because they had the same ID.
  assert(userStore.users.length === 2)
  assert(todo.creator instanceof User)
  assert(todo.creator._id === 1)
  assert(todo.creator.twitterHandle === undefined) // we don't have this yet.

  return userStore.fetchUser(1).then(user => {
    assert(user === todo.creator) // Same instance, woah!
    assert(user.twitterHandle === 'mweststrate')

    console.log('Todo:', todo.text)
    console.log('Todo created', todo.createdAt.fromNow())
    console.log('Todo creator twitter handle:', todo.creator.twitterHandle)
    console.log('-------------')
    console.log('So long, and thanks for all the fish!')
  })
})
