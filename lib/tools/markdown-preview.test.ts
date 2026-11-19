import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MARKDOWN_DRAFT_KEY,
  isEmptyHref,
  loadDraft,
  saveDraft,
  toMermaidId,
} from './markdown-preview'

// node 環境には localStorage がないので、テストごとに Map で用意する
function installStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  })
  return store
}

beforeEach(() => {
  installStorage()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('下書きの保存', () => {
  it('保存した Markdown を読み込める', () => {
    expect(saveDraft('# タイトル')).toBe(true)
    expect(loadDraft()).toBe('# タイトル')
  })

  it('保存は1件だけで、前の内容を置き換える', () => {
    saveDraft('1回目')
    saveDraft('2回目')
    expect(loadDraft()).toBe('2回目')
  })

  it('保存がなければ空', () => {
    expect(loadDraft()).toBe('')
  })

  it('文字列以外や壊れた JSON は空として扱う', () => {
    localStorage.setItem(MARKDOWN_DRAFT_KEY, JSON.stringify({ text: 'a' }))
    expect(loadDraft()).toBe('')
    localStorage.setItem(MARKDOWN_DRAFT_KEY, '{壊れた')
    expect(loadDraft()).toBe('')
  })

  it('localStorage が例外を投げても、読み込みは空・保存は false になる', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
    })
    expect(loadDraft()).toBe('')
    expect(saveDraft('a')).toBe(false)
  })
})

describe('toMermaidId', () => {
  it('英数字と - 以外を取り除く', () => {
    expect(toMermaidId(':r1:')).toBe('mermaid-r1')
    expect(toMermaidId('«R2a»')).toBe('mermaid-R2a')
    expect(toMermaidId('_R_eat_')).toBe('mermaid-Reat')
  })
})

describe('isEmptyHref', () => {
  it('空や未指定の href を空とみなす', () => {
    expect(isEmptyHref(undefined)).toBe(true)
    expect(isEmptyHref('')).toBe(true)
    expect(isEmptyHref('  ')).toBe(true)
    expect(isEmptyHref('https://example.com')).toBe(false)
  })
})
