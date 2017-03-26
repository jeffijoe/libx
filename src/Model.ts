import { action } from 'mobx'
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
  set (attributes: IObjectHash, options?: IModelOptions): this

  /**
   * Called at various points, giving the model a chance to parse attributes
   * before setting them.
   */
  parse (attributes: IObjectHash, options?: IModelOptions): IObjectHash

  /**
   * Picks the specified properties from the model.
   */
  pick <K extends keyof this> (properties: K[]): Pick<this, K>
}

/**
 * The Model class in all its' glory.
 */
export class Model implements IModel {
  /**
   * If attributes are specified, `set` is called along with the model options.
   */
  constructor (attributes?: IObjectHash, options?: IModelOptions) {
    this.set = action('set', this.set.bind(this))

    // Just in case we have a root store,
    // set it so we don't need the initialize pattern.
    if (options && (options as any).rootStore) {
      (this as any).rootStore = (options as any).rootStore
    }

    if (attributes) {
      this.set(attributes, options)
    }
  }

  /**
   * Sets the attributes on the model, optionally calling `parse` first.
   */
  set (attributes: IObjectHash, options?: IModelOptions): this {
    if (options) {
      if (options.parse) {
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
  parse (attributes: IObjectHash, options?: IModelOptions): IObjectHash {
    return attributes
  }

  /**
   * Picks properties and returns them as an object.
   */
  pick <K extends keyof this> (properties: K[]): Pick<this, K> {
    // No guarantees that what is returned actually matches
    // the given TypeScript generic.
    return pick(this, properties)
  }
}
