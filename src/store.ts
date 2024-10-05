import {
  collection,
  ICollection,
  ICollectionOptions,
  IObjectHash,
  Model,
} from '.'

export interface IModelCollectionOptions<T extends Model>
  extends ICollectionOptions<T> {
  idAttribute?: string
  rootStore?: any
  model?: any
}

/**
 * Store interface.
 */
export interface IStore {
  rootStore: any
}

/**
 * Options passed to stores at construction time.
 */
export interface IStoreOpts {
  rootStore: any
}

/**
 * Base store class for others to extend.
 */
export class Store implements IStore {
  /**
   * Reference to the root store.
   */
  rootStore: any

  /**
   * Constructor.
   */
  constructor(opts: IStoreOpts) {
    this.rootStore = opts.rootStore
  }

  /**
   * Creates a collection that gets the root store passed in.
   */
  collection<TModel extends Model>(
    opts: IModelCollectionOptions<TModel>,
  ): ICollection<TModel> {
    return collection({
      rootStore: this.rootStore,
      create: (
        attributes: IObjectHash,
        options: IModelCollectionOptions<TModel>,
      ) =>
        new opts.model(attributes, {
          stripUndefined: true,
          parse: true,
          ...options,
        }),
      update: (
        existing: TModel,
        input: IObjectHash,
        options: IModelCollectionOptions<TModel>,
      ) =>
        existing.set(input, {
          stripUndefined: true,
          parse: true,
          ...options,
        } as any),
      ...opts,
    } as IModelCollectionOptions<TModel>)
  }
}
