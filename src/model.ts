import { action, extendObservable } from 'mobx'
const pick = require('lodash/pick')
const pickBy = require('lodash/pickBy')

/**
 * Any object hash.
 */
export interface IObjectHash {
  [key: string]: any
}

/**
 * Various options used by the model.
 */
export interface IModelOptions {
  /**
   * Calls `parse` on the model before settings attributes.
   */
  parse?: boolean

  /**
   * Remove all undefined values before assigning to model?
   */
  stripUndefined?: boolean
}

/**
 * Model interface.
 */
export interface IModel {
  /**
   * Sets attributes on the model, optionally calling `parse`.
   */
  set(attributes: IObjectHash, options?: IModelOptions): this

  /**
   * Called at various points, giving the model a chance to parse attributes
   * before setting them.
   */
  parse(attributes: IObjectHash, options?: IModelOptions): IObjectHash

  /**
   * Picks the specified properties from the model.
   */
  pick<K extends keyof this>(properties: K[]): Pick<this, K>
}

/**
 * A map of actions.
 */
export interface IActionsMap<T> {
  [key: string]: (this: T, ...args: any[]) => any
}

/**
 * Fluid model, used only with the model factory.
 */
export type IFluidModel<T> = T &
  IModel & {
    /**
     * Calls `Object.assign` with the model as the target.
     */
    assign<S>(source: S): IFluidModel<T & S>
    assign<S1, S2>(source1: S1, source2: S2): IFluidModel<T & S1 & S2>
    assign<S1, S2, S3>(
      source1: S1,
      source2: S2,
      source3: S3
    ): IFluidModel<T & S1 & S2 & S3>
    assign(...sources: any[]): IFluidModel<T>

    /**
     * Calls `extendObservable` on itself.
     */
    extendObservable<O>(properties: O): IFluidModel<T & O>

    /**
     * Adds the specified actions to the model.
     */
    withActions<A>(actions: A): IFluidModel<T & A>

    /**
     * Invokes the specified function with the model as the first parameter,
     * it should modify the model in-place. Return value is for TypeScript
     * type inference only, the passed-in model is actually returned.
     */
    decorate<D>(fn: (target: IFluidModel<T>) => D): IFluidModel<T & D>
  }

/**
 * The Model class in all its' glory.
 */
export class Model implements IModel {
  /**
   * If attributes are specified, `set` is called along with the model options.
   */
  constructor(attributes?: IObjectHash, options?: IModelOptions) {
    this.set = action('set', this.set.bind(this))

    // Just in case we have a root store,
    // set it so we don't need the initialize pattern.
    if (options && (options as any).rootStore) {
      ;(this as any).rootStore = (options as any).rootStore
    }

    if (attributes) {
      this.set(attributes, options)
    }
  }

  /**
   * Sets the attributes on the model, optionally calling `parse` first.
   */
  set(attributes: IObjectHash, options?: IModelOptions): this {
    if (options) {
      if (options.parse && this.parse) {
        attributes = this.parse(attributes, options)
      }

      if (options.stripUndefined) {
        // Strip out any undefined keys.
        attributes = pickBy(attributes, (prop: any) => prop !== undefined)
      }
    }

    Object.assign(this, attributes)
    return this
  }

  /**
   * Used to convert a raw object to something more meaningful.
   */
  parse(attributes: IObjectHash, options?: IModelOptions): IObjectHash {
    return attributes
  }

  /**
   * Picks properties and returns them as an object.
   */
  pick<K extends keyof this>(properties: K[]): Pick<this, K> {
    // No guarantees that what is returned actually matches
    // the given TypeScript generic.
    return pick(this, properties)
  }
}

/**
 * Creates (or enhances) an object with Model capabilities.
 *
 * @param target Optional target object to enhance. Defaults to a new one.
 */
export function model<T extends {}>(target?: T): T & IFluidModel<T> {
  target = target || ({} as any)
  target = Object.assign(target, {
    set: action('set', Model.prototype.set.bind(target)),
    pick: Model.prototype.pick.bind(target),
    parse: (target as any).parse || Model.prototype.parse.bind(target),
    assign: Object.assign.bind(null, target),
    extendObservable: extendObservable.bind(null, target),
    withActions: withActions.bind(target),
    decorate: decorate.bind(target)
  }) as any

  return target as T & IFluidModel<T>
}

/**
 * Attaches `actions` to ´this`.
 *
 * @param this Object to attach actions to.
 * @param actions Object with actions to attach. Each value is passed to ´action` and bound.
 */
function withActions<T, A extends { [key: string]: Function }>(
  this: IFluidModel<T>,
  actions: A
): IFluidModel<T> & A {
  for (const key in actions) {
    // istanbul ignore else
    if (Object.prototype.hasOwnProperty.call(actions, key)) {
      const prop = actions[key]
      /*tslint:disable-next-line*/
      if (typeof prop !== 'function') {
        throw new Error(
          'The object passed to withActions should only contain ' +
            `functions, but found ${key}: ${typeof prop}`
        )
      }
      ;(this as any)[key] = action(key, prop.bind(this))
    }
  }
  return this as IFluidModel<T> & A
}

/**
 * Invokes the method that will decorate the passed-in model.
 *
 * @param fn Function to invoke passing in the model as the first parameter.
 */
function decorate<T, D>(
  this: IFluidModel<T>,
  fn: (target: IFluidModel<T>) => D
): IFluidModel<T & D> {
  fn(this)
  return this as IFluidModel<T & D>
}
