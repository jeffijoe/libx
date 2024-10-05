import { action } from 'mobx'

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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.rootStore = (options as any).rootStore
    }

    if (attributes) {
      this.set(attributes, options)
    }
  }

  /**
   * Sets the attributes on the model, optionally calling `parse` first.
   */
  set(attributes: IObjectHash, options?: IModelOptions): this {
    if (!attributes) {
      return this
    }

    if (options) {
      if (options.parse && this.parse) {
        attributes = this.parse(attributes, options)
      }

      if (options.stripUndefined) {
        const result: Partial<IObjectHash> = {}
        for (const key in attributes) {
          const value = attributes[key]
          if (value !== undefined) {
            result[key] = value
          }
        }

        attributes = result
      }
    }

    Object.assign(this, attributes)
    return this
  }

  /**
   * Used to convert a raw object to something more meaningful.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parse(attributes: IObjectHash, options?: IModelOptions): IObjectHash {
    return attributes
  }

  /**
   * Picks the specified props
   *
   * @param properties
   * @returns
   */
  pick<K extends keyof this>(properties: K[]): Pick<this, K> {
    const result: any = {}
    for (const prop of properties) {
      result[prop] = this[prop]
    }
    return result
  }
}
