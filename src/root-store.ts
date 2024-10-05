import type { Store } from './store'

export type StoreClass<TRootStore> =
  | (new (props: { rootStore: TRootStore }) => Store)
  | ((props: { rootStore: TRootStore }) => any)
  | any

export type StoreFactory<TRootStore> = (
  storeClass: StoreClass<TRootStore>,
  rootStore: TRootStore,
) => Store

/**
 * Store map.
 */
export interface IStoreMap<TRootStore> {
  /**
   * If the value is a function, it's invoked with `new ({ rootStore: ...})`.
   */
  [key: string]: StoreClass<TRootStore>
}

/**
 * Creates a simple root store.
 */
export function createRootStore<TRootStore>(
  obj: IStoreMap<TRootStore>,
  factory?: StoreFactory<TRootStore>,
): TRootStore {
  const result: any = {}
  factory =
    factory || ((storeClass, rootStore) => new storeClass({ rootStore }))

  Object.keys(obj).forEach((key) => {
    const val = obj[key]
    result[key] = typeof val === 'function' ? factory!(val, result) : val
  })

  return result
}
