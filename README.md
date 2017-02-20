# libx

[![npm](https://img.shields.io/npm/v/libx.svg?maxAge=1000)](https://www.npmjs.com/package/libx)
[![dependency Status](https://img.shields.io/david/jeffijoe/libx.svg?maxAge=1000)](https://david-dm.org/jeffijoe/libx)
[![devDependency Status](https://img.shields.io/david/dev/jeffijoe/libx.svg?maxAge=1000)](https://david-dm.org/jeffijoe/libx)
[![Build Status](https://img.shields.io/travis/jeffijoe/libx.svg?maxAge=1000)](https://travis-ci.org/jeffijoe/libx)
[![Coveralls](https://img.shields.io/coveralls/jeffijoe/libx.svg?maxAge=1000)](https://coveralls.io/github/jeffijoe/libx)
[![npm](https://img.shields.io/npm/dt/libx.svg?maxAge=1000)](https://www.npmjs.com/package/libx)
[![npm](https://img.shields.io/npm/l/libx.svg?maxAge=1000)](https://github.com/jeffijoe/libx/blob/master/LICENSE.md)
[![node](https://img.shields.io/node/v/libx.svg?maxAge=1000)](https://www.npmjs.com/package/libx)

Collection + Model infrastructure for [MobX](https://github.com/mobxjs/mobx) applications. Written in [TypeScript](https://github.com/Microsoft/TypeScript).

## Install

```
npm install --save libx
```

# Why?

Maintaining large application state is hard. Maintaining single references to entities for a single source of truth is 
hard. But it doesn't have to be.

**LibX** is inspired by [Backbone](https://github.com/jashkenas/backbone)'s notion of Collections and Models, and makes it sexy by using [MobX](https://github.com/mobxjs/mobx) to manage state,
instead of using events.

**TL;DR:** Maintaining only a single instance of a model is a chore. With LibX, it's not.

# Examples

See the [TypeScript example][ts-example] and [Babel example][babel-example] for runnable examples (in Node).

# Documentation

Coming sooner or later - until then, feel free to inspect the examples and source code.

# Author

Jeff Hansen - [@Jeffijoe](https://twitter.com/Jeffijoe)

[ts-example]: /examples/typescript
[babel-example]: /examples/babel
