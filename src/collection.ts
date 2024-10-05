import { observable, IObservableArray, action } from 'mobx'
import { referenceOne, referenceMany } from './normalization'
import { moveItem } from './array-utils'

/**
 * Used in various collection functions such as `map`, `filter`..
 */
export interface IIteratee<T, M> {
  (input: T, index: number): M
}

/**
 * Indexed collection used for reusing models.
 */
export interface ICollection<T> {
  /**
   * The actual item map.
   */
  items: IObservableArray<T>
  /**
   * Getter for the items length.
   */
  length: number
  /**
   * Adds one or more models to the end of the collection.
   */
  add(models: T | T[]): this
  /**
   * Multi-version of `create`.
   */
  create(data: any[], createOpts?: ICollectionOptions<T>): T[]
  /**
   * Like `set`, but will add regardless of whether an id is present or not.
   * This has the added risk of resulting multiple model instances if you don't make sure
   * to update the existing model once you do have an id. The model id is what makes the whole
   * one-instance-per-entity work.
   */
  create(data: any, createOpts?: ICollectionOptions<T>): T
  /**
   * Gets items by ids.
   */
  get(id: any[]): Array<T | undefined>
  /**
   * Gets a item by id.
   */
  get(id: any): T | undefined
  /**
   * Same as the singular version, but with multiple.
   */
  set<D>(
    data?: D[],
    setOpts?: ICollectionOptions<T>,
  ): D extends undefined ? undefined : T[]
  /**
   * Adds a single item and maps it using the mapper in the options.
   */
  set<D>(
    data?: D,
    setOpts?: ICollectionOptions<T>,
  ): D extends undefined ? undefined : T
  /**
   * Clears the collection.
   */
  clear(): this
  /**
   * Maps over the items.
   */
  map<M>(iteratee: IIteratee<T, M>): M[]
  /**
   * Filters the items.
   */
  filter(iteratee: IIteratee<T, boolean>): T[]
  /**
   * Determines if there are any items that match the predicate.
   */
  some(iteratee: IIteratee<T, boolean>): boolean
  /**
   * Determines if all items match the predicate.
   */
  every(iteratee: IIteratee<T, boolean>): boolean
  /**
   * Finds a particular item.
   */
  find(iteratee: IIteratee<T, boolean>): T | undefined
  /**
   * Removes an item based on ID or the item itself.
   */
  remove(modelOrId: T | string): this
  /**
   * Slices the array.
   */
  slice(start?: number, end?: number): T[]
  /**
   * Moves an item from one index to another, using MobX's `move`.
   */
  move(fromIndex: number, toIndex: number): this
  /**
   * Returns the item at the specified index.
   */
  at(index: number): T | undefined
  /**
   * Runs a `forEach` over the items and returns the collection.
   */
  forEach(iteratee: IIteratee<T, any>): this
  /**
   * Given a single or list of ids and a collection with models,
   * returns the model(s) the IDs represent. If `field` is specified, it
   * will be used instead of the source collection model ID.
   * Only the first matching model per ID is returned.
   * For "one/many-to-many" type references, use `referenceMany`.
   *
   * @param {Array<string>} ids
   * @param {keyof T} field
   */
  referenceOne(id: ModelId): T | null
  referenceOne(ids: Array<ModelId>): Array<T>
  referenceOne<K extends keyof T>(id: T[K], field?: keyof T): T | null
  referenceOne<K extends keyof T>(ids: Array<T[K]>, field?: keyof T): Array<T>
  referenceOne<K extends keyof T>(
    ids: T[K] | Array<T[K]>,
    field?: keyof T,
  ): T | null | Array<T>
  /**
   * Given a single or list of ids and a collection with models,
   * returns the models that match `field`.
   * All matching models are returned and flattened.
   * For "one-to-one" type references, use `referenceOne`.
   *
   * @param {Array<string>} ids
   * @param {keyof T} field
   */
  referenceMany<K extends keyof T>(
    ids: T[K] | Array<T[K]>,
    field: keyof T,
  ): Array<T>
}

/**
 * Called when the collection wants to add a new item.
 */
export interface ICreateFunc<T> {
  (input: any, opts: ICollectionOptions<T>): T
}

/**
 * Called when the collection wants to update an existing item.
 */
export interface IUpdateFunc<T> {
  (existing: T, input: any, opts: ICollectionOptions<T>): T
}

/**
 * Function used for getting the ID of a particular input.
 */
export interface IGetId<T> {
  // Returned value will be stringified.
  (obj: T, opts: ICollectionOptions<T>): any
}

/**
 * Collection options.
 */
export interface ICollectionOptions<T> {
  /**
   * May be used by callbacks like `getModelId` and `getDataId`
   */
  idAttribute?: string
  /**
   * Called when the collection wants to add a new item.
   */
  create?: ICreateFunc<T>
  /**
   * Called when the collection wants to update an existing item with more data.
   */
  update?: IUpdateFunc<T>
  /**
   * Used to get the ID of a model that was passed in. Whatever is returned from
   * this should be coercible to a string, and is used for indexing.
   */
  getModelId?: IGetId<T>
  /**
   * Used to get an ID from input data, used to determine whether to create
   * or update.
   */
  getDataId?: IGetId<any>
}

/**
 * Default collection options.
 */
export const defaults: ICollectionOptions<any> = {
  create: (input) => input,
  getDataId: (input: any, opts) => input[opts.idAttribute || 'id'],
  getModelId: (existing, opts) => existing[opts.idAttribute || 'id'],
  idAttribute: 'id',
  update: (existing, input) => Object.assign(existing, input),
}

/**
 * Possible model IDs.
 */
export type ModelId = string | number | Date

/**
 * Creates a collection.
 *
 * @type {T} The item type.
 * @type {O} Additional options.
 */
export function collection<T>(opts?: ICollectionOptions<T>): ICollection<T> {
  opts = Object.assign({}, defaults, opts)
  // Holds the actual items.
  const items: IObservableArray<T> = observable.array([], { deep: false })
  const idMap = new Map<string, T>()

  const self = {
    items,
    add: action(add),
    get,
    set: action(set),
    create: action(create),
    remove: action(remove),
    clear: action(clear),
    filter: (iteratee: IIteratee<T, unknown>) => items.filter(iteratee),
    some: (iteratee: IIteratee<T, boolean>) => items.some(iteratee),
    every: (iteratee: IIteratee<T, boolean>) => items.every(iteratee),
    find: (iteratee: IIteratee<T, unknown>) => items.find(iteratee),
    map: <M>(iteratee: IIteratee<T, M>) => items.map(iteratee),
    referenceOne: ((ids: any, field: any): any =>
      (referenceOne as any)(self, ids, field)) as any,
    referenceMany: ((ids: any, field: any): any =>
      (referenceMany as any)(self, ids, field)) as any,
    forEach: (iteratee: IIteratee<T, any>) => {
      items.forEach(iteratee)
      return self
    },
    at: (index: number) => items[index],
    slice,
    move,
    get length() {
      return items.length
    },
  }

  function get(id: ModelId[]): Array<T | undefined>
  function get(id: ModelId): T | undefined
  function get(
    id: ModelId | ModelId[],
  ): (T | undefined) | Array<T | undefined> {
    /*tslint:disable-next-line*/
    if (id === undefined || id === null) {
      return undefined
    }

    if (Array.isArray(id)) {
      return id.map(get) as T[]
    }

    const idAsString: string = id.toString()
    const fromMap = idMap.get(idAsString)
    if (fromMap) {
      return fromMap
    }

    const found = items.find((item) => {
      const modelId = opts!.getModelId!(item, opts!)
      if (!modelId) {
        return false
      }

      return modelId.toString() === idAsString
    })

    if (found !== undefined) {
      idMap.set(idAsString, found)
    }

    return found
  }

  function set(data?: any[], setOpts?: ICollectionOptions<T>): T[] | undefined
  function set(data?: any, setOpts?: ICollectionOptions<T>): T | undefined
  function set(
    data?: any | any[],
    setOpts?: ICollectionOptions<T>,
  ): T | T[] | undefined {
    setOpts = Object.assign({}, opts as any, setOpts)
    if (!data) {
      return undefined
    }

    if (Array.isArray(data)) {
      return data.map((d) => set(d, setOpts) as T)
    }

    let dataId = opts!.getDataId!(data, setOpts!)
    if (dataId === undefined) {
      return undefined
    }

    if (dataId === null) {
      throw new TypeError(`${dataId} is not a valid ID`)
    }

    dataId = dataId.toString()

    let existing = get(dataId as string)
    if (existing) {
      opts!.update!(existing, data, Object.assign({}, opts as any, setOpts))
      return existing
    }

    const created = opts!.create!(data, Object.assign({}, opts as any, setOpts))

    // If creating this object resulted in another object with the same ID being
    // added, reuse it instead of adding this new one.
    existing = get(dataId as string)
    if (existing) {
      opts!.update!(existing, data, Object.assign({}, opts as any, setOpts))
      return existing
    }

    items.push(created)
    idMap.set(dataId, created)
    return created
  }

  function create(data: any[], createOpts?: ICollectionOptions<T>): T[]
  function create(data: any, createOpts?: ICollectionOptions<T>): T
  function create(
    data: any[] | any,
    createOpts?: ICollectionOptions<T>,
  ): T[] | T {
    if (Array.isArray(data)) {
      return data.map((d) => create(d, createOpts))
    }

    createOpts = Object.assign({}, opts as any, createOpts)
    const dataId = createOpts!.getDataId!(data, createOpts!)
    if (dataId !== undefined && dataId !== null) {
      return set(data, createOpts) as any
    }

    const created = createOpts!.create!(data, createOpts!)
    add(created)
    return created
  }

  function add(models: T | T[]): ICollection<T> {
    if (!Array.isArray(models)) {
      return add([models])
    }

    // Filter out existing models.
    models = models.filter((x) => items.indexOf(x) === -1)
    items.push(...models)
    return self
  }

  function remove(modelOrId: T | ModelId): ICollection<T> {
    const model =
      typeof modelOrId === 'string' ||
      typeof modelOrId === 'number' ||
      modelOrId instanceof Date
        ? get(modelOrId)
        : modelOrId
    if (!model) {
      return self
    }

    items.remove(model)

    const modelId = opts!.getModelId!(model, opts!)
    /* istanbul ignore else */
    if (modelId !== null && modelId !== undefined) {
      idMap.delete(modelId.toString())
    }

    return self
  }

  function clear(): ICollection<T> {
    items.clear()
    idMap.clear()
    return self
  }

  function slice(start?: number, end?: number) {
    return items.slice(start, end)
  }

  function move(fromIndex: number, toIndex: number) {
    moveItem(items, fromIndex, toIndex)
    return self
  }

  return self
}
