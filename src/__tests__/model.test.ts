import { Model, model } from '..'
import { observable, isObservableProp } from 'mobx'

describe('Model', () => {
  describe('constructor', () => {
    it('sets properties', () => {
      class M extends Model {
        @observable hello: string
      }

      const m = new M({ hello: 'world' })
      expect(m.hello).toBe('world')
    })

    it('calls #parse when setting attributes', () => {
      class M extends Model {
        @observable hello: string

        parse() {
          return { hello: 'sucker' }
        }
      }

      const m = new M({ hello: 'world' }, { parse: true })
      expect(m.hello).toBe('sucker')
    })
  })

  describe('#set', () => {
    it('calls #parse when options.parse = true', () => {
      class M extends Model {
        @observable hello: string

        parse() {
          return { hello: 'sucker' }
        }
      }

      const m = new M()
      expect(m.set({ hello: 'world' }, { parse: true })).toBe(m)
      expect(m.hello).toBe('sucker')
    })

    it('does not #parse when no parse option is given', () => {
      class M extends Model {
        @observable hello: string

        parse() {
          return { hello: 'sucker' }
        }
      }

      const m = new M()
      expect(m.set({ hello: 'world' })).toBe(m)
      expect(m.hello).toBe('world')
    })

    it('strips out undefined values', () => {
      class M extends Model {
        @observable hello: string
      }

      const m = new M({ hello: 'world' }, { stripUndefined: true })
      expect(m.set({ hello: undefined }, { stripUndefined: true })).toBe(m)
      expect(m.hello).toBe('world')
    })
  })

  describe('#pick', () => {
    it('returns a subset of properties', () => {
      class M extends Model {
        @observable hello: string
        @observable world: string
      }

      const m = new M({ hello: 'world', world: 'hello' })
      const picked = m.pick(['hello'])
      expect(picked.hello).toBe('world')
      expect('world' in picked).toBeFalsy()
    })
  })
})

describe('model', () => {
  it('returns a new model when nothing is specified', () => {
    const m = model()
    m.set({ hello: 'world' })
    expect((m as any).hello).toBe('world')
  })

  it('enhances the specified object', () => {
    const existing = { hello: 'guys' }
    const m = model(existing)
    m.set({ hello: 'world' })
    expect(existing.hello).toBe('world')
  })

  describe('extendObservable', () => {
    it('works', () => {
      const m = model().extendObservable({
        hello: 'world',
        get world() {
          return 1337
        }
      })
      expect(m.hello).toBe('world')
      expect(m.world).toBe(1337)
      expect(isObservableProp(m, 'hello')).toBeTruthy()
    })
  })

  describe('withActions', () => {
    it('attaches actions', () => {
      const m = model()
        .assign({
          cid: 'hey'
        })
        .extendObservable({
          hello: 'people'
        })
        .withActions({
          setHello(this: any, s: string) {
            this.hello = s
          }
        })

      m.setHello('world')
      expect(m.hello).toBe('world')
      expect(m.cid).toBe('hey')
    })

    it('fails when not a function', () => {
      expect(() => model().withActions({ hello: 'haha' })).toThrow(
        /hello.*string/i
      )
    })
  })

  describe('decorate', () => {
    it('invokes the function', () => {
      const m = model()
        .assign({ hello: 'people' })
        .decorate(t => {
          const v = {
            validate() {
              return t.hello === 'world'
            }
          }
          Object.assign(t, v)
          return null! as typeof v
        })
      expect(m.validate()).toBe(false)
      m.set({ hello: 'world' })
      expect(m.validate()).toBe(true)
    })
  })
})
