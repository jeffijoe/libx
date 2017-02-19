import { Model } from '../src'
import { observable } from 'mobx'
import { expect } from 'chai'

describe('Model', () => {
  describe('constructor', () => {
    it('sets properties', () => {
      class M extends Model {
        @observable hello: string
      }

      const m = new M({ hello: 'world' })
      expect(m.hello).to.equal('world')
    })

    it('calls #parse when setting attributes', () => {
      class M extends Model {
        @observable hello: string

        parse () {
          return { hello: 'sucker' }
        }
      }

      const m = new M({ hello: 'world' }, { parse: true })
      expect(m.hello).to.equal('sucker')
    })
  })

  describe('#set', () => {
    it('calls #parse when options.parse = true', () => {
      class M extends Model {
        @observable hello: string

        parse () {
          return { hello: 'sucker' }
        }
      }

      const m = new M()
      expect(m.set({ hello: 'world' }, { parse: true })).to.equal(m)
      expect(m.hello).to.equal('sucker')
    })

    it('does not #parse when no parse option is given', () => {
      class M extends Model {
        @observable hello: string

        parse () {
          return { hello: 'sucker' }
        }
      }

      const m = new M()
      expect(m.set({ hello: 'world' })).to.equal(m)
      expect(m.hello).to.equal('world')
    })

    it('strips out undefined values', () => {
      class M extends Model {
        @observable hello: string
      }

      const m = new M({ hello: 'world' }, { stripUndefined: true })
      expect(m.set({ hello: undefined }, { stripUndefined: true })).to.equal(m)
      expect(m.hello).to.equal('world')
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
      expect(picked.hello).to.equal('world')
      expect('world' in picked).to.be.false
    })
  })
})
