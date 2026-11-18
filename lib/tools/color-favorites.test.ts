import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FAVORITES_KEY,
  MAX_FAVORITES,
  canAddFavorite,
  isFavorite,
  loadFavorites,
  removeFavorite,
  saveFavorites,
  toggleFavorite,
} from './color-favorites'

function memoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
}

function hexes(count: number) {
  return Array.from(
    { length: count },
    (_, i) => `#${i.toString(16).padStart(6, '0')}`,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('toggleFavorite', () => {
  it('未登録の色を末尾に加える', () => {
    const result = toggleFavorite(['#111111'], '#ff0000')
    expect(result).toEqual({ ok: true, list: ['#111111', '#ff0000'] })
  })

  it('登録済みの色は外す', () => {
    const result = toggleFavorite(['#111111', '#ff0000'], '#ff0000')
    expect(result).toEqual({ ok: true, list: ['#111111'] })
  })

  it(`上限（${MAX_FAVORITES}件）のときは未登録の色を加えられない`, () => {
    expect(toggleFavorite(hexes(MAX_FAVORITES), '#ff0000')).toEqual({
      ok: false,
      reason: 'full',
    })
  })

  it('上限のときでも登録済みの色は外せる', () => {
    const list = hexes(MAX_FAVORITES)
    const result = toggleFavorite(list, list[0])
    expect(result.ok && result.list).toHaveLength(MAX_FAVORITES - 1)
  })
})

describe('isFavorite / canAddFavorite / removeFavorite', () => {
  it('登録済みかどうかを返す', () => {
    expect(isFavorite(['#ff0000'], '#ff0000')).toBe(true)
    expect(isFavorite(['#ff0000'], '#00ff00')).toBe(false)
  })

  it('上限未満なら追加できる', () => {
    expect(canAddFavorite(hexes(MAX_FAVORITES - 1))).toBe(true)
    expect(canAddFavorite(hexes(MAX_FAVORITES))).toBe(false)
  })

  it('指定した色だけを削除し、残りの並びは変えない', () => {
    expect(
      removeFavorite(['#111111', '#222222', '#333333'], '#222222'),
    ).toEqual(['#111111', '#333333'])
  })
})

describe('loadFavorites / saveFavorites', () => {
  it('保存した一覧を同じ順序で読み込む', () => {
    vi.stubGlobal('localStorage', memoryStorage())
    saveFavorites(['#ff0000', '#336699'])
    expect(loadFavorites()).toEqual(['#ff0000', '#336699'])
  })

  it('保存値がなければ空の一覧', () => {
    vi.stubGlobal('localStorage', memoryStorage())
    expect(loadFavorites()).toEqual([])
  })

  it.each([
    ['壊れた JSON', '{broken'],
    ['配列でない', '{"a":1}'],
    ['形式違いの要素', '["#ff0000","red"]'],
    ['大文字の HEX', '["#FF0000"]'],
    ['重複', '["#ff0000","#ff0000"]'],
    ['上限超え', JSON.stringify(hexes(MAX_FAVORITES + 1))],
  ])('不正な保存値（%s）は空の一覧として扱う', (_, raw) => {
    vi.stubGlobal('localStorage', memoryStorage({ [FAVORITES_KEY]: raw }))
    expect(loadFavorites()).toEqual([])
  })

  it('localStorage が例外を投げても空の一覧を返し、保存しても例外を投げない', () => {
    const fail = () => {
      throw new DOMException('denied', 'SecurityError')
    }
    vi.stubGlobal('localStorage', { getItem: fail, setItem: fail })
    expect(loadFavorites()).toEqual([])
    expect(() => saveFavorites(['#ff0000'])).not.toThrow()
  })
})
