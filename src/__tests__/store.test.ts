import { Model, ICollection, IStoreOpts, Store } from '..'

class RootStore {}

class Stuff extends Model {
  rootStore: RootStore
  hello: string
  id: string
}

class TestStore extends Store {
  stuffs: ICollection<Stuff>
  otherStuffs: ICollection<any>
  rootStore: RootStore

  constructor(opts: IStoreOpts) {
    super(opts)
    this.stuffs = this.collection<Stuff>({
      model: Stuff,
    })
  }
}

describe('Store', function () {
  describe('#collection', function () {
    it('returns a model collection', function () {
      const rootStore = new RootStore()
      const store = new TestStore({
        rootStore,
      })

      const stuff1 = store.stuffs.set({ id: 1 })
      expect(stuff1).toBeInstanceOf(Stuff)
      expect(stuff1.id).toBe(1)
      expect(stuff1.rootStore).toBe(rootStore)

      const stuff1Updated = store.stuffs.set({ id: 1, hello: 'world' })
      expect(stuff1Updated).toBe(stuff1)
      expect(stuff1.hello).toBe('world')
    })
  })
})
