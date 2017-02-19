import { spy } from 'sinon'
import { createRootStore } from '../src/RootStore'
import { expect } from 'chai'
import { Store } from '../src/Store'

class Store1 extends Store {

}

class Store2 extends Store {

}

describe('createRootStore', () => {
  it('creates an object that injects itself to values passed in', () => {
    const spy1 = spy()
    const rootStore = createRootStore<{ store1: Store1, store2: Store2, val1: number }>({
      store1: Store1,
      store2: Store2,
      val1: 123,
      func1: spy1
    })

    expect(rootStore.store1).to.be.instanceOf(Store1)
    expect(rootStore.store2).to.be.instanceOf(Store2)
    expect(rootStore.val1).to.equal(123)
    const call1 = spy1.getCall(0).args[0]
    expect(call1.rootStore).to.equal(rootStore)
  })

  it('lets me customize the factory', () => {
    const factory = spy((storeClass, rootStore) => new storeClass({ rootStore }))
    const spy1 = spy()
    const rootStore = createRootStore<{ store1: Store1, store2: Store2, val1: number }>({
      store1: Store1,
      store2: Store2,
      val1: 123,
      func1: spy1
    }, factory)

    expect(rootStore.store1).to.be.instanceOf(Store1)
    expect(rootStore.store2).to.be.instanceOf(Store2)
    expect(rootStore.val1).to.equal(123)
    const call1 = spy1.getCall(0).args[0]
    expect(call1.rootStore).to.equal(rootStore)
    expect(factory.callCount).to.equal(3)
  })
})
