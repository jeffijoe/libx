import { createRootStore } from '../rootStore'
import { Store } from '../Store'

class Store1 extends Store {}

class Store2 extends Store {}

describe('createRootStore', () => {
  it('creates an object that injects itself to values passed in', () => {
    const spy1 = jest.fn()
    const rootStore = createRootStore<{
      store1: Store1
      store2: Store2
      val1: number
    }>({
      store1: Store1,
      store2: Store2,
      val1: 123,
      func1: spy1
    })

    expect(rootStore.store1).toBeInstanceOf(Store1)
    expect(rootStore.store2).toBeInstanceOf(Store2)
    expect(rootStore.val1).toBe(123)
    const call1 = spy1.mock.calls[0][0]
    expect(call1.rootStore).toBe(rootStore)
  })

  it('lets me customize the factory', () => {
    const factory = jest.fn(
      (storeClass, rootStore) => new storeClass({ rootStore })
    )
    const spy1 = jest.fn()
    const rootStore = createRootStore<{
      store1: Store1
      store2: Store2
      val1: number
    }>(
      {
        store1: Store1,
        store2: Store2,
        val1: 123,
        func1: spy1
      },
      factory
    )

    expect(rootStore.store1).toBeInstanceOf(Store1)
    expect(rootStore.store2).toBeInstanceOf(Store2)
    expect(rootStore.val1).toBe(123)
    const call1 = spy1.mock.calls[0][0]
    expect(call1.rootStore).toBe(rootStore)
    expect(factory.mock.calls.length).toBe(3)
  })
})
