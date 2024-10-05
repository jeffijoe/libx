/*
  MIT License

  Copyright (c) 2016 MobX

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/
import { IObservableArray } from 'mobx'

/**
 * Moves an item from one position to another, checking that the indexes given are within bounds.
 *
 * @example
 * const source = observable([1, 2, 3])
 * moveItem(source, 0, 1)
 * console.log(source.map(x => x)) // [2, 1, 3]
 *
 * @export
 * @param {ObservableArray<T>} target
 * @param {number} fromIndex
 * @param {number} toIndex
 * @returns {ObservableArray<T>}
 */
export function moveItem<T>(
  target: IObservableArray<T>,
  fromIndex: number,
  toIndex: number,
) {
  checkIndex(target, fromIndex)
  checkIndex(target, toIndex)
  if (fromIndex === toIndex) {
    return
  }
  const oldItems = target.slice()
  let newItems: T[]
  if (fromIndex < toIndex) {
    newItems = [
      ...oldItems.slice(0, fromIndex),
      ...oldItems.slice(fromIndex + 1, toIndex + 1),
      oldItems[fromIndex],
      ...oldItems.slice(toIndex + 1),
    ]
  } else {
    // toIndex < fromIndex
    newItems = [
      ...oldItems.slice(0, toIndex),
      oldItems[fromIndex],
      ...oldItems.slice(toIndex, fromIndex),
      ...oldItems.slice(fromIndex + 1),
    ]
  }
  target.replace(newItems)
  return target
}

/**
 * Checks whether the specified index is within bounds. Throws if not.
 *
 * @private
 * @param {ObservableArray<any>} target
 * @param {number }index
 */
function checkIndex(target: IObservableArray<any>, index: number) {
  if (index < 0) {
    throw new Error(`[mobx.array] Index out of bounds: ${index} is negative`)
  }
  const length = (target as any).length
  if (index >= length) {
    throw new Error(
      `[mobx.array] Index out of bounds: ${index} is not smaller than ${length}`,
    )
  }
}
