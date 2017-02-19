
import { IStoreOpts, Store } from '../src/Store'
import { ICollection } from '../src/collection'
import { Model } from '../src/Model'
import { expect } from 'chai'

class RootStore {}

class Stuff extends Model {
  rootStore: RootStore
  hello: string
  id: string
}

class TestStore extends Store {
  stuffs: ICollection<Stuff>
  rootStore: RootStore

  constructor (opts: IStoreOpts) {
    super(opts)
    this.stuffs = this.collection<Stuff>({
      model: Stuff
    })
  }
}

describe('Store', function () {
  describe('#collection', function () {
    it('returns a model collection', function () {
      const rootStore = new RootStore()
      const store = new TestStore({
        rootStore
      })

      const stuff1 = store.stuffs.set({ id: 1 })
      expect(stuff1).to.be.instanceOf(Stuff)
      expect(stuff1!.id).to.equal(1)
      expect(stuff1!.rootStore).to.equal(rootStore)

      const stuff1Updated = store.stuffs.set({ id: 1, hello: 'world' })
      expect(stuff1Updated).to.equal(stuff1)
      expect(stuff1!.hello).to.equal('world')
    })
  })
})
