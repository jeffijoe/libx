import { collection, referenceOne, referenceMany } from '..'

interface Model1 {
  id: number
  model2Id: string
}

interface Model2 {
  id: string
}

interface Model3 {
  id: string
  model2Id: string
}

const c1 = collection<Model1>()
c1.set([
  { id: 1, model2Id: '1' },
  { id: 2, model2Id: '2' },
  { id: 3, model2Id: '2' }
])
const c2 = collection<Model2>()
c2.set([{ id: '1' }, { id: '2' }])
const c3 = collection<Model3>()
c3.set({ id: '3', model2Id: '2' })

describe('referenceOne', () => {
  it('works with ids', () => {
    const m2 = referenceOne(c2, '2')!
    expect(m2.id).toBe('2')

    const m1s = referenceOne(c1, [1, 2, 4])
    expect(m1s).toHaveLength(2)
    expect(m1s[0].id).toBe(1)
    expect(m1s[1].id).toBe(2)
  })

  it('works with fields', () => {
    const m1s = referenceOne(c1, ['2', '3'], 'model2Id')
    expect(m1s).toHaveLength(1)
    expect(m1s[0].id).toBe(2)

    const m1 = referenceOne(c1, '2', 'model2Id')!
    expect(m1.id).toBe(2)
  })

  it('can be used as instance method on collections', () => {
    const m1s = c1.referenceOne(['2', '3'], 'model2Id')
    expect(m1s).toHaveLength(1)
    expect(m1s[0].id).toBe(2)

    const m1 = c1.referenceOne('2', 'model2Id')!
    expect(m1.id).toBe(2)
  })
})

describe('referenceMany', () => {
  it('works with a single id', () => {
    const m2s = referenceMany(c1, '2', 'model2Id')
    expect(m2s).toHaveLength(2)
    expect(m2s[0].id).toBe(2)
    expect(m2s[1].id).toBe(3)
  })

  it('works with many ids', () => {
    const m2s = referenceMany(c1, ['1', '2', '3'], 'model2Id')
    expect(m2s).toHaveLength(3)
    expect(m2s[0].id).toBe(1)
    expect(m2s[1].id).toBe(2)
    expect(m2s[2].id).toBe(3)
  })

  it('can be used as an instance method on collections', () => {
    const m2s = c1.referenceMany(['1', '2', '3'], 'model2Id')
    expect(m2s).toHaveLength(3)
    expect(m2s[0].id).toBe(1)
    expect(m2s[1].id).toBe(2)
    expect(m2s[2].id).toBe(3)
  })
})
