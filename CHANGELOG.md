# Changelog

## 1.0.0

* 🚨 **Breaking**: upgraded to MobX v4. To keep using MobX <= v3, use the LibX 0.x release.
* ✨ **New**: add `referenceOne` and `referenceMany` utility functions.

## 0.3.0

* Added factory-based model API.
* Internal ID map for faster `get` lookups.

## 0.2.2

* Added `collection.forEach` and `collection.at`.

## 0.2.1

* Added `collection.move(fromIndex: number, toIndex: number)` which calls `items.move` on the inner Observable Array

## 0.2.0

* parsing a 3+ level deep parent->child->parent structure no longer results in duplicate models. This works by checking the collection _after parsing_ to see if a model with the same ID was added to the collection. If it was, parse the data _again_ but while _updating the existing model_. Refer to the README for an example.

## 0.1.7

* Calling `collection.get(undefined)` no longer errors when passed null or undefined.

## 0.1.6

* Added LoDash `orderBy` - [#2](https://github.com/jeffijoe/libx/issues/2)

## 0.1.4

* Added more docs
* More LoDash functions

## 0.1.3

* Moved LoDash and MobX out of dependencies and into peerDependencies.

## 0.1.2

* Fixed a stack overflow in `create`

## 0.1.1

* More tests
* Rearranged overloads

## 0.1.0

* First official release
