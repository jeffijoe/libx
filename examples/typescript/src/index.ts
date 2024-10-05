/**
 * This example illustrates how we can achieve type safety with TS.
 * See the Babel example for an explanation of the example itself.
 */

import { Store, Model as BaseModel } from '../../../lib'
import { observable, computed } from 'mobx'
import * as assert from 'assert'
import * as moment from 'moment'
import { API } from './api'

// Only needed in TS to get proper root store typing.
class Model extends BaseModel {
  rootStore: RootStore
}

// ---------------------------
// Todos
// ---------------------------
class Todo extends Model {
  @observable text: string
  @observable completed: boolean = false
  @observable creatorId: number
  @observable createdAt: moment.Moment

  @computed
  get creator() {
    return this.rootStore.userStore.users.referenceOne(this.creatorId)
  }

  // Override `parse` to customize how we transform external JSON to
  // properties for this model.
  parse(json: any) {
    // We have a separate store for users, so
    // we set it there.
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
  todos = this.collection<Todo>({ model: Todo })

  fetchTodos() {
    // Fetch the todos, then load them into the collection.
    return API.getTodos().then<Todo[]>(this.todos.set)
  }
}

// ---------------------------
// Users
// ---------------------------
class User extends Model {
  _id: number
  @observable name: string
  @observable twitterHandle: string

  @computed
  get todos() {
    return this.rootStore.todoStore.todos.referenceMany(this._id, 'creatorId')
  }
}

class UserStore extends Store {
  users = this.collection<User>({
    model: User,
    idAttribute: '_id', // just to demo.
  })

  fetchUser(id: number) {
    return API.getUser(id).then(this.users.set)
  }
}

// ---------------------------
// Root store - aka the glue.
// See the Babel example for a different approach.
// ---------------------------
class RootStore {
  todoStore: TodoStore
  userStore: UserStore

  constructor() {
    const makeOpts = () => ({ rootStore: this })

    this.todoStore = new TodoStore(makeOpts())
    this.userStore = new UserStore(makeOpts())
  }
}

// ---------------------------
// Lets go!
// ---------------------------
const root = new RootStore()

const { todoStore, userStore } = root

todoStore.fetchTodos().then((todos) => {
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
