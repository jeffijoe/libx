import { Model } from '..'
import { observable } from 'mobx'

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
