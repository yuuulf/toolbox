import { afterEach, describe, expect, it, vi } from 'vitest'
import { readJson, writeJson } from './storage'

type Options = { length: number }

const isOptions = (value: unknown): value is Options =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { length?: unknown }).length === 'number'

const FALLBACK: Options = { length: 16 }
const KEY = 'toolbox:test:options'

function createMemoryStorage(initial: Record<string, string> = {}): Storage {
  const store = new Map(Object.entries(initial))
  return {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => {
      store.delete(key)
    },
    setItem: (key, value) => {
      store.set(key, String(value))
    },
  }
}

function createThrowingStorage(): Storage {
  const fail = () => {
    throw new DOMException('denied', 'SecurityError')
  }
  return {
    length: 0,
    clear: fail,
    getItem: fail,
    key: fail,
    removeItem: fail,
    setItem: fail,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('readJson / writeJson', () => {
  it('書き込んだ値を読み出せる', () => {
    vi.stubGlobal('localStorage', createMemoryStorage())
    expect(writeJson(KEY, { length: 24 })).toBe(true)
    expect(readJson(KEY, isOptions, FALLBACK)).toEqual({ length: 24 })
  })

  it('保存値がないときは fallback を返す', () => {
    vi.stubGlobal('localStorage', createMemoryStorage())
    expect(readJson(KEY, isOptions, FALLBACK)).toBe(FALLBACK)
  })

  it('JSON として読めない保存値では fallback を返す', () => {
    vi.stubGlobal('localStorage', createMemoryStorage({ [KEY]: '{broken' }))
    expect(readJson(KEY, isOptions, FALLBACK)).toBe(FALLBACK)
  })

  it('検証に失敗した保存値では fallback を返す', () => {
    vi.stubGlobal(
      'localStorage',
      createMemoryStorage({ [KEY]: JSON.stringify({ length: '24' }) }),
    )
    expect(readJson(KEY, isOptions, FALLBACK)).toBe(FALLBACK)
  })

  it('localStorage が例外を投げても読み込みは fallback を返し、書き込みは false を返す', () => {
    vi.stubGlobal('localStorage', createThrowingStorage())
    expect(readJson(KEY, isOptions, FALLBACK)).toBe(FALLBACK)
    expect(writeJson(KEY, { length: 24 })).toBe(false)
  })

  it('localStorage が存在しない環境でも例外を投げない', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(readJson(KEY, isOptions, FALLBACK)).toBe(FALLBACK)
    expect(writeJson(KEY, { length: 24 })).toBe(false)
  })
})
