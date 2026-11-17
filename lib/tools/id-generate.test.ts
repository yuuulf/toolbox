import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CHARSETS,
  DEFAULT_PASSWORD_OPTIONS,
  generatePassword,
  generateUuids,
  isPasswordOptions,
  loadPasswordOptions,
  PASSWORD_OPTIONS_KEY,
  savePasswordOptions,
} from './id-generate'

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

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

const hasAny = (text: string, charset: string) =>
  [...text].some((c) => charset.includes(c))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('generateUuids', () => {
  it('v4 形式（小文字16進）の UUID を1件生成する', () => {
    const result = generateUuids(1)
    expect(result.ok && result.uuids).toHaveLength(1)
    expect(result.ok && result.uuids[0]).toMatch(UUID_V4)
  })

  it('指定した個数の互いに異なる UUID を生成する', () => {
    const result = generateUuids(5)
    const uuids = result.ok ? result.uuids : []
    expect(uuids).toHaveLength(5)
    expect(new Set(uuids).size).toBe(5)
    for (const uuid of uuids) expect(uuid).toMatch(UUID_V4)
  })

  it('1〜100 の範囲外や整数でない個数は拒否する', () => {
    for (const count of [0, 101, -1, 1.5, Number.NaN]) {
      expect(generateUuids(count)).toEqual({ ok: false, error: 'out-of-range' })
    }
    expect(generateUuids(100).ok).toBe(true)
  })

  it('crypto.randomUUID がない環境でも getRandomValues から v4 を作る', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: crypto.getRandomValues.bind(crypto),
    })
    const result = generateUuids(20)
    for (const uuid of result.ok ? result.uuids : []) {
      expect(uuid).toMatch(UUID_V4)
    }
  })
})

describe('generatePassword', () => {
  it('既定設定では16文字で、全文字種を1文字以上含む', () => {
    for (let i = 0; i < 1000; i++) {
      const result = generatePassword(DEFAULT_PASSWORD_OPTIONS)
      if (!result.ok) throw new Error('生成に失敗')
      const { password } = result
      expect(password).toHaveLength(16)
      expect(hasAny(password, CHARSETS.upper)).toBe(true)
      expect(hasAny(password, CHARSETS.lower)).toBe(true)
      expect(hasAny(password, CHARSETS.digits)).toBe(true)
      expect(hasAny(password, CHARSETS.symbols)).toBe(true)
    }
  })

  it('数字のみ・長さ8では数字だけの8文字になる', () => {
    const result = generatePassword({
      length: 8,
      upper: false,
      lower: false,
      digits: true,
      symbols: false,
    })
    expect(result.ok && result.password).toMatch(/^[0-9]{8}$/)
  })

  it('文字種が1つも選ばれていなければ拒否する', () => {
    expect(
      generatePassword({
        length: 16,
        upper: false,
        lower: false,
        digits: false,
        symbols: false,
      }),
    ).toEqual({ ok: false, error: 'no-charset' })
  })

  it('長さが 4〜128 の範囲外なら拒否する', () => {
    for (const length of [3, 129, 10.5]) {
      expect(generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length })).toEqual(
        { ok: false, error: 'invalid-length' },
      )
    }
    expect(
      generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 4 }).ok,
    ).toBe(true)
    expect(
      generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 128 }).ok,
    ).toBe(true)
  })

  it('Math.random を使わず Web Crypto の乱数を使う', () => {
    const mathRandom = vi.spyOn(Math, 'random')
    const getRandomValues = vi.spyOn(crypto, 'getRandomValues')
    generatePassword(DEFAULT_PASSWORD_OPTIONS)
    generateUuids(3)
    expect(mathRandom).not.toHaveBeenCalled()
    expect(getRandomValues).toHaveBeenCalled()
  })
})

describe('パスワード設定の保存', () => {
  it('保存した設定を読み戻せる', () => {
    vi.stubGlobal('localStorage', createMemoryStorage())
    const options = { ...DEFAULT_PASSWORD_OPTIONS, length: 24, symbols: false }
    savePasswordOptions(options)
    expect(loadPasswordOptions()).toEqual(options)
  })

  it('保存値がなければ既定値を返す', () => {
    vi.stubGlobal('localStorage', createMemoryStorage())
    expect(loadPasswordOptions()).toEqual(DEFAULT_PASSWORD_OPTIONS)
  })

  it('壊れた JSON・範囲外の長さ・型の違う値では既定値を返す', () => {
    for (const raw of [
      '{broken',
      JSON.stringify({ ...DEFAULT_PASSWORD_OPTIONS, length: 999 }),
      JSON.stringify({ ...DEFAULT_PASSWORD_OPTIONS, upper: 'yes' }),
      JSON.stringify({ length: 16 }),
      'null',
    ]) {
      vi.stubGlobal(
        'localStorage',
        createMemoryStorage({ [PASSWORD_OPTIONS_KEY]: raw }),
      )
      expect(loadPasswordOptions()).toEqual(DEFAULT_PASSWORD_OPTIONS)
    }
  })

  it('isPasswordOptions は正しい形だけを受け入れる', () => {
    expect(isPasswordOptions(DEFAULT_PASSWORD_OPTIONS)).toBe(true)
    expect(isPasswordOptions({ ...DEFAULT_PASSWORD_OPTIONS, length: 3 })).toBe(
      false,
    )
    expect(isPasswordOptions('x')).toBe(false)
  })
})
