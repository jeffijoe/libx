import { collection, Model, ICollection } from '..'

describe('collection', () => {
  it('can be created', () => {
    const c = collection<{}>()
    expect(c).toBeDefined()
    expect(c.items).toBeDefined()
  })

  describe('#set', () => {
    it('adds and reuses object', () => {
      const c = collection<Model>({
        create: (input) => new Model(input),
        update: (existing, input) => existing.set(input),
      })
      const result = c.set({ id: 1 })
      const result2 = c.set({ id: 1, top: 'kek' })
      expect(result).toBeInstanceOf(Model)
      expect(result2).toBeInstanceOf(Model)
      expect(result).toBe(result2)
    })

    it('returns undefined when passed undefined', () => {
      const c = collection<Model>()
      expect(c.set()).toBe(undefined)
    })

    it('defaults to "id" for id attribute', () => {
      const c = collection<Model>({ idAttribute: '' })
      c.set({ id: 1 })
      expect(c.get(1)).toBeDefined()
    })

    it('supports adding multiple', () => {
      const c = collection<{ id: number }>()
      const a = c.set([{ id: 1 }, { id: 2 }])
      const m1 = a[0]
      const m2 = a[1]
      expect(m1.id).toBe(1)
      expect(m2.id).toBe(2)
    })

    describe('circular reference parsing', () => {
      it('only adds one', () => {
        const c1 = collection<any>({
          create: (data) => parseParent(data),
          update: (existing, data) =>
            Object.assign(existing, parseParent(data)),
        })

        const c2 = collection<any>({
          create: (data) => parseChild(data),
          update: (existing, data) => Object.assign(existing, parseChild(data)),
        })

        const data = {
          id: 'p1',
          prop1: 'hello',
          child: {
            id: 'c1',
            parent: {
              id: 'p1',
              prop2: 'world',
            },
          },
        }

        const parent = c1.set(data)
        const child = c2.get('c1')
        expect(c1.length).toBe(1)
        expect(c2.length).toBe(1)
        expect(parent.prop1).toBe('hello')
        expect(parent.prop2).toBe('world')
        expect(parent.child).toBe(child)
        expect(child.parent).toBe(parent)

        function parseParent({ child, ...data }: any) {
          child = c2.set(child)
          return {
            ...data,
            child,
          }
        }

        function parseChild({ parent, ...data }: any) {
          parent = c1.set(parent)
          return {
            ...data,
            parent,
          }
        }
      })
    })
  })

  describe('#create', () => {
    it('acts like #set if an id is present', () => {
      const c = collection<{ id: number }>()
      const o1 = c.set({ id: 1 })
      const o2 = c.create({ id: 1 })
      expect(o1).toBe(o2)
    })

    it('adds the model even if it does not have an id', () => {
      const c = collection<{ id: number; hello?: string }>()
      const o1 = c.set({ id: 1 })
      const o2 = c.create({ hello: 'world' })
      expect(o2.hello).toBe('world')
      expect(o2).not.toBe(o1)
    })

    it('adds multiple', () => {
      const c = collection<{ id: number; hello?: string }>()
      c.set({ id: 1 })
      const [o2, o3] = c.create([
        { hello: 'world' },
        { id: 3, hello: 'libx' },
      ] as any[])
      expect(o2.hello).toBe('world')
      expect(o3.id).toBe(3)
    })
  })

  describe('#add', () => {
    it('adds a single or multiple models', () => {
      const c = collection<{ id: number }>()
      c.add({ id: 1 })
      expect(c.length).toBe(1)
      c.add([{ id: 2 }, { id: 3 }])
      expect(c.length).toBe(3)
    })

    it('does not add duplicate instances', () => {
      const c = collection<{ id: number }>()
      const item1 = { id: 1 }
      c.add(item1)
      expect(c.length).toBe(1)
      expect(item1).toBe(c.get(1))
      c.add(item1)
      expect(c.length).toBe(1)
      c.add([item1, { id: 2 }])
      expect(c.length).toBe(2)
    })
  })

  describe('#get', () => {
    it('returns objects based on default resolution strategy (id lookup)', () => {
      const c = collection<{ id: number }>()
      const setted = c.set({ id: 1 })
      const getted = c.get('1')
      expect(getted).toBe(setted)
    })

    it('returns undefined when not found', () => {
      const c = collection<{ id: number }>()
      c.set([{ id: 1 }])
      c.add({} as any)
      expect(c.get(2)).toBe(undefined)
    })

    it('returns undefined when passed undefined or null', () => {
      const c = collection<Model>()
      expect(c.get(undefined)).toBe(undefined)
      expect(c.get(null)).toBe(undefined)
    })

    it('can get multiple items', () => {
      const c = collection<{ id: number }>()
      c.set({ id: 1 })
      c.set({ id: 2 })
      const result = c.get([1, 2, 3] as any[])
      expect(result.length).toBe(3)
      expect(result[0]!.id).toBe(1)
      expect(result[1]!.id).toBe(2)
      expect(result[2]).toBe(undefined)
    })

    it('supports overriding how ID resolution is done on both ends', () => {
      interface IData {
        _id: string
      }

      interface IModel {
        identifier: number
        top?: string
      }

      const c = collection<IModel>({
        create: (data: IData) => ({ identifier: parseInt(data._id, 10) }),
        getDataId: (input: IData) => input._id,
        getModelId: (input: IModel) => input.identifier,
      })

      const result = c.set({ _id: '1' })
      const result2 = c.set({ _id: '1', top: 'kek' })
      expect(result.identifier).toBe(1)
      expect(result2.identifier).toBe(1)
      expect(result).toBe(result2)
      expect(result.top).toBe('kek')
      expect(result2.top).toBe('kek')
    })

    it('throws when an invalid ID is returned from the data', () => {
      let c = collection<{ id: number }>({
        getDataId: () => null,
      })

      expect(() => c.set({ id: 2 })).toThrow(/null.*ID/i)

      c = collection<{ id: number }>({
        getDataId: () => undefined,
      })

      expect(c.set({ id: 2 })).toBeUndefined()
    })

    it('clears the ID cache', () => {
      const c = collection<{ id: number }>({ idAttribute: null! })
      c.set({ id: 1 })
      c.set({ id: 2 })

      const got = c.get(1)
      expect(got!.id).toBe(1)

      c.remove('1')
      expect(c.get('1')).toBeUndefined()
      expect(c.get('2')).not.toBeUndefined()
    })
  })

  describe('#move', () => {
    it('works', () => {
      type Value = { id: number }
      const c: ICollection<Value> = collection<Value>()
      c.set([{ id: 1 }, { id: 2 }, { id: 3 }])
      c.move(1, 1)
      c.move(0, 2)
      expect(c.items[0].id).toBe(2)
      expect(c.items[1].id).toBe(3)
      expect(c.items[2].id).toBe(1)

      c.move(2, 0)
      expect(c.items[0].id).toBe(1)
      expect(c.items[1].id).toBe(2)
      expect(c.items[2].id).toBe(3)
    })

    it('checks indexes', () => {
      type Value = { id: number }
      const c: ICollection<Value> = collection<Value>()
      c.set([{ id: 1 }, { id: 2 }, { id: 3 }])
      expect(() => c.move(-1, 2)).toThrowErrorMatchingSnapshot()
      expect(() => c.move(0, 3)).toThrowErrorMatchingSnapshot()
    })
  })

  describe('lodash functions', () => {
    type Value = { id: number; name: string; gender: 'male' | 'female' }
    let c: ICollection<Value>
    beforeEach(() => {
      c = collection<Value>()
      c.set([
        {
          id: 1,
          name: 'Jeff',
          gender: 'male',
        },
        {
          id: 2,
          name: 'Amanda',
          gender: 'female',
        },
        {
          id: 3,
          name: 'Will',
          gender: 'male',
        },
      ])
    })

    it('#map', () => {
      const mapped = c.map((x) => x.name)
      expect(mapped).toEqual(['Jeff', 'Amanda', 'Will'])
    })

    it('#filter', () => {
      const male = c.filter((x) => x.gender === 'male')
      expect(male.length).toBe(2)
      expect(male[0].id).toBe(1)
      expect(male[1].id).toBe(3)
    })

    it('#find', () => {
      const jeff = c.find((x) => x.name === 'Jeff')
      expect(jeff).toBeDefined()
      expect(jeff!.id).toBe(1)
    })

    it('#slice', () => {
      expect(c.slice(0, 1).length).toBe(1)
    })

    it('#orderBy', () => {
      let ordered = c.orderBy(['name'], ['asc'])
      expect(ordered[0].name).toBe('Amanda')
      expect(ordered[1].name).toBe('Jeff')
      expect(ordered[2].name).toBe('Will')

      ordered = c.orderBy(['name'], ['desc'])
      expect(ordered[0].name).toBe('Will')
      expect(ordered[1].name).toBe('Jeff')
      expect(ordered[2].name).toBe('Amanda')
    })

    it('#forEach', () => {
      const touchedValues: Array<Value> = []
      const touchedIndexes: Array<number> = []
      c.forEach((item, index) => {
        touchedValues.push(item)
        touchedIndexes.push(index)
      })

      expect(touchedValues).toEqual(c.slice())
      expect(touchedIndexes).toEqual(c.map((x, i) => i))
    })

    it('#at', () => {
      expect(c.at(0)).toBe(c.items[0])
      expect(c.at(1)).toBe(c.items[1])
    })
  })

  describe('#clear', () => {
    it('clears the collection', () => {
      const c = collection<{ id: number }>()
      c.set([{ id: 1 }, { id: 2 }])
      expect(c.length).toBe(2)
      c.clear()
      expect(c.length).toBe(0)
    })
  })

  describe('#remove', () => {
    let c: ICollection<{ id: number }>
    beforeEach(() => {
      c = collection<{ id: number }>()
      c.set([
        {
          id: 1,
        },
        {
          id: 2,
        },
      ])
    })

    it('removes by id', () => {
      expect(c.length).toBe(2)
      c.remove('1')
      expect(c.length).toBe(1)
      expect(c.get(2)).toEqual({ id: 2 })
    })

    it('removes with a model reference', () => {
      expect(c.length).toBe(2)
      c.remove(c.get(1)!)
      expect(c.length).toBe(1)
      expect(c.get(2)).toEqual({ id: 2 })
    })

    it('returns self even when not removing anything', () => {
      expect(c.remove('1234')).toBe(c)
    })
  })

  // describe('bench', () => {
  //   it('does not crumble', function () {
  //     this.timeout(100000)
  //     const c = collection<{ id: number, hello: string }, {}>()
  //     for (let i = 1; i <= 500000; i++) {
  //       c.add({ id: i, hello: 'world' })
  //     }

  //     console.time('Lets do this')
  //     c.get(1000)
  //     console.timeEnd('Lets do this')
  //   })
  // })
})
