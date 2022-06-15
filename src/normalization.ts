import { ICollection, ModelId } from '.'

/**
 * Given a single or list of ids and a collection with models,
 * returns the model(s) the IDs represent. If `field` is specified, it
 * will be used instead of the source collection model ID.
 * Only the first matching model per ID is returned.
 * For "one/many-to-many" type references, use `referenceMany`.
 *
 * @param {Collection<*>} source
 * @param {Array<string>} ids
 * @param {keyof T} field
 */
export function referenceOne<T, K extends keyof T>(
  source: ICollection<T>,
  id: ModelId
): T | null
export function referenceOne<T, K extends keyof T>(
  source: ICollection<T>,
  ids: Array<ModelId>
): Array<T>
export function referenceOne<T, K extends keyof T>(
  source: ICollection<T>,
  id: T[K],
  field?: keyof T
): T | null
export function referenceOne<T, K extends keyof T>(
  source: ICollection<T>,
  ids: Array<T[K]>,
  field?: keyof T
): Array<T>
export function referenceOne<T, K extends keyof T>(
  source: ICollection<T>,
  ids: T[K] | Array<T[K]>,
  field?: keyof T
): T | null | Array<T> {
  if (Array.isArray(ids)) {
    // prettier-ignore
    return ids.map(id => referenceOne(source, id, field)).filter(Boolean) as Array<T>
  }

  if (field !== undefined) {
    return source.find((x) => x[field] === ids) || null
  }

  return source.get(ids) || null
}

/**
 * Given a single or list of ids and a collection with models,
 * returns the models that match `field`.
 * All matching models are returned and flattened.
 * For "one-to-one" type references, use `referenceOne`.
 *
 * @param {Collection<*>} source
 * @param {Array<string>} ids
 * @param {keyof T} field
 */
export function referenceMany<T, K extends keyof T>(
  source: ICollection<T>,
  ids: T[K] | Array<T[K]>,
  field: keyof T
): Array<T> {
  if (Array.isArray(ids)) {
    const result = ids
      .map((id) => referenceMany(source, id, field))
      .filter(Boolean)
    return [].concat.apply([], result as any)
  }

  return source.filter((x) => x[field] === ids)
}
