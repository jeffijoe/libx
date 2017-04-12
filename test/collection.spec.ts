import { expect } from 'chai'
import { collection, Model, ICollection } from '../src'
import { IObjectLike } from '../src/collection'

describe('collection', () => {
  it('can be created', () => {
    const c = collection<{}>()
    expect(c).to.exist
    expect(c.items).to.exist
  })

  describe('#set', () => {
    it('adds and reuses object', () => {
      const c = collection<Model>({
        create: (input) => new Model(input),
        update: (existing, input) => existing.set(input)
      })
      const result = c.set({ id: 1 })
      const result2 = c.set({ id: 1, top: 'kek' })
      expect(result).to.be.an.instanceOf(Model)
      expect(result2).to.be.an.instanceOf(Model)
      expect(result).to.equal(result2)
    })

    it('returns undefined when passed undefined', () => {
      const c = collection<Model>()
      expect(c.set()).to.equal(undefined)
    })

    it('defaults to "id" for id attribute', () => {
      const c = collection<Model>({ idAttribute: '' })
      c.set({ id: 1 })
      expect(c.get(1)).to.be.ok
    })

    it('supports adding multiple', () => {
      const c = collection<Model>()
      const a = c.set([
        { id: 1 },
        { id: 2 }
      ])
      const m1 = a![0]
      const m2 = a![1]
      expect(m1.id).to.equal(1)
      expect(m2.id).to.equal(2)
    })
  })

  describe('#create', () => {
    it('acts like #set if an id is present', () => {
      const c = collection<{ id: number }>()
      const o1 = c.set({ id: 1})
      const o2 = c.create({ id: 1})
      expect(o1).to.equal(o2)
    })

    it('adds the model even if it does not have an id', () => {
      const c = collection<{ id: number, hello?: string }>()
      const o1 = c.set({id: 1})
      const o2 = c.create({ hello: 'world' })
      expect(o2.hello).to.equal('world')
    })

    it('adds multiple', () => {
      const c = collection<{ id: number, hello?: string }>()
      const o1 = c.set({id: 1})
      const [o2, o3] = c.create([
        { hello: 'world' },
        { id: 3, hello: 'libx' }
      ] as IObjectLike[])
      expect(o2.hello).to.equal('world')
      expect(o3.id).to.equal(3)
    })
  })

  describe('#add', () => {
    it('adds a single or multiple models', () => {
      const c = collection<{ id: number}>()
      c.add({ id: 1 })
      expect(c.length).to.equal(1)
      c.add([{ id: 2 }, { id: 3 }])
      expect(c.length).to.equal(3)
    })

    it('does not add duplicate instances', () => {
      const c = collection<{ id: number}>()
      const item1 = { id: 1 }
      c.add(item1)
      expect(c.length).to.equal(1)
      expect(item1).to.equal(c.get(1))
      c.add(item1)
      expect(c.length).to.equal(1)
      c.add([item1, { id: 2 }])
      expect(c.length).to.equal(2)
    })
  })

  describe('#get', () => {
    it('returns objects based on default resolution strategy (id lookup)', () => {
      const c = collection<{ id: number}>()
      const setted = c.set({ id: 1})
      const getted = c.get('1')
      expect(getted).to.equal(setted)
    })

    it('returns undefined when not found', () => {
      const c = collection<{ id: number }>()
      c.set([{ id: 1 }])
      c.add({ } as any)
      expect(c.get(2)).to.equal(undefined)
    })

    it('can get multiple items', () => {
      const c = collection<{ id: number}>()
      c.set({ id: 1 })
      c.set({ id: 2 })
      const result = c.get(<any[]> [1, 2, 3])
      expect(result.length).to.equal(3)
      expect(result[0]!.id).to.equal(1)
      expect(result[1]!.id).to.equal(2)
      expect(result[2]).to.equal(undefined)
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
        getModelId: (input) => input.identifier
      })

      const result = c.set({ _id: '1' })
      const result2 = c.set({ _id: '1', top: 'kek' })
      expect(result!.identifier).to.equal(1)
      expect(result2!.identifier).to.equal(1)
      expect(result).to.equal(result2)
      expect(result!.top).to.equal('kek')
      expect(result2!.top).to.equal('kek')
    })

    it('throws when an invalid ID is returned from the data', () => {
      let c = collection<{ id: number }>({
        getDataId: () => null
      })

      expect(() => c.set({ id: 2 })).to.throw(TypeError, /null.*ID/i)

      c = collection<{ id: number}>({
        getDataId: () => undefined
      })

      expect(c.set({ id: 2 })).to.be.undefined
    })
  })

  describe('lodash functions', () => {
    type Value = { id: number; name: string; gender: 'male' | 'female' }
    let c: ICollection<Value>
    beforeEach(() => {
      c = collection<Value>()
      c.set([{
        id: 1,
        name: 'Jeff',
        gender: 'male'
      }, {
        id: 2,
        name: 'Amanda',
        gender: 'female'
      }, {
        id: 3,
        name: 'Will',
        gender: 'male'
      }])
    })

    it('#map', () => {
      const mapped = c.map(x => x.name)
      expect(mapped).to.deep.equal(['Jeff', 'Amanda', 'Will'])
    })

    it('#filter', () => {
      const male = c.filter(x => x.gender === 'male')
      expect(male.length).to.equal(2)
      expect(male[0].id).to.equal(1)
      expect(male[1].id).to.equal(3)
    })

    it('#find', () => {
      const jeff = c.find(x => x.name === 'Jeff')
      expect(jeff).to.exist
      expect(jeff!.id).to.equal(1)
    })

    it('#slice', () => {
      expect(c.slice(0, 1).length).to.equal(1)
    })
    
    it('#orderBy', () => {
      let ordered = c.orderBy(['name'], ['asc'])
      expect(ordered[0].name).to.equal('Amanda')
      expect(ordered[1].name).to.equal('Jeff')
      expect(ordered[2].name).to.equal('Will')
      
      ordered = c.orderBy(['name'], ['desc'])
      expect(ordered[0].name).to.equal('Will')
      expect(ordered[1].name).to.equal('Jeff')
      expect(ordered[2].name).to.equal('Amanda')
    })
  })

  describe('#clear', () => {
    it('clears the collection', () => {
      const c = collection<{ id: number }>()
      c.set([{ id: 1 }, { id: 2 }])
      expect(c.length).to.equal(2)
      c.clear()
      expect(c.length).to.equal(0)
    })
  })

  describe('#remove', () => {
    let c: ICollection<{id: number}>
    beforeEach(() => {
      c = collection<{id: number}>()
      c.set([{
        id: 1
      }, {
        id: 2
      }])
    })

    it('removes by id', () => {
      expect(c.length).to.equal(2)
      c.remove('1')
      expect(c.length).to.equal(1)
      expect(c.get(2)).to.deep.equal({ id: 2 })
    })

    it('removes with a model reference', () => {
      expect(c.length).to.equal(2)
      c.remove(c.get(1)!)
      expect(c.length).to.equal(1)
      expect(c.get(2)).to.deep.equal({ id: 2 })
    })

    it('returns self even when not removing anything', () => {
      expect(c.remove('1234')).to.equal(c)
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
