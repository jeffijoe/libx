export class API {
  // Use your imagination..
  static getTodos() {
    // GET /api/todos ...
    return Promise.resolve<any[]>([
      {
        id: 'abcd123',
        text: 'Install MobX',
        completed: false,
        dateCreated: '2017-02-19T14:30:00',
        creator: {
          _id: 1,
          name: 'Michel Weststrate'
        }
      },
      {
        id: '123abcd',
        text: 'Install LibX.',
        completed: true,
        dateCreated: '2017-02-19T14:54:00',
        creator: {
          _id: 2,
          name: 'Jeff Hansen'
        }
      },
      {
        id: 'a1b2c3',
        text: 'Build awesome things.',
        completed: false,
        dateCreated: '2017-02-19T15:22:00',
        creator: {
          _id: 2,
          name: 'Jeff Hansen'
        }
      }
    ])
  }

  // this endpoint will get a little more meat for our users.
  static getUser(id: number) {
    const users = [
      {
        _id: 1,
        name: 'Michel Weststrate',
        twitterHandle: 'mweststrate'
      },
      {
        _id: 2,
        name: 'Jeff Hansen',
        twitterHandle: 'jeffijoe'
      }
    ]
    return Promise.resolve(users.find(x => x._id === id))
  }
}
