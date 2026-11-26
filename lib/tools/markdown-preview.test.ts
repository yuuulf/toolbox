import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_FILE_NAME,
  MARKDOWN_DRAFT_KEY,
  MAX_FILE_NAME_LENGTH,
  isEmptyHref,
  loadDraft,
  saveDraft,
  toMarkdownFileName,
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

describe('toMarkdownFileName', () => {
  it('最初のレベル1見出しから名前を付け、使えない文字を取り除く', () => {
    expect(toMarkdownFileName('# 議事録 11/26\n\n本文')).toBe('議事録 1126.md')
  })

  it('2つ目以降の見出しは使わない', () => {
    expect(toMarkdownFileName('本文\n# 最初\n# 次')).toBe('最初.md')
  })

  it.each([
    ['空', ''],
    ['本文だけ', '本文だけ'],
    ['レベル2見出しだけ', '## 小見出し'],
    ['# の後に空白がない', '#タグ'],
    ['空の見出し', '#'],
  ])('%s のときは markdown.md', (_, markdown) => {
    expect(toMarkdownFileName(markdown)).toBe(`${DEFAULT_FILE_NAME}.md`)
  })

  it.each([
    ['```', '```sh\n# コメント\n```\n\n# 本当の見出し'],
    ['~~~', '~~~\n# コメント\n~~~\n# 本当の見出し'],
    ['``` の中の ~~~', '```\n~~~\n# コメント\n```\n# 本当の見出し'],
  ])('%s のコードブロックの中の # は見出しにしない', (_, markdown) => {
    expect(toMarkdownFileName(markdown)).toBe('本当の見出し.md')
  })

  it('閉じの # と前後の空白、末尾のピリオドを取り除く', () => {
    expect(toMarkdownFileName('  #   タイトル...  ##  ')).toBe('タイトル.md')
  })

  it('見出しの文字の一部の # は残す', () => {
    expect(toMarkdownFileName('# C#')).toBe('C#.md')
  })

  it('使えない文字と制御文字を取り除く', () => {
    expect(toMarkdownFileName('# a\\b:c*d?e"f<g>h|i\u0007j')).toBe(
      'abcdefghij.md',
    )
  })

  it('使える文字が残らないときは markdown.md', () => {
    expect(toMarkdownFileName('# ???')).toBe(`${DEFAULT_FILE_NAME}.md`)
  })

  it('長い名前はコードポイント単位で切り、絵文字を途中で切らない', () => {
    const name = '😀'.repeat(MAX_FILE_NAME_LENGTH + 5)
    expect(toMarkdownFileName(`# ${name}`)).toBe(
      `${'😀'.repeat(MAX_FILE_NAME_LENGTH)}.md`,
    )
  })

  it('切った後の末尾の空白も取り除く', () => {
    const name = `${'a'.repeat(MAX_FILE_NAME_LENGTH - 1)} b`
    expect(toMarkdownFileName(`# ${name}`)).toBe(
      `${'a'.repeat(MAX_FILE_NAME_LENGTH - 1)}.md`,
    )
  })

  it('CRLF の改行でも見出しを見つける', () => {
    expect(toMarkdownFileName('本文\r\n# 見出し\r\n')).toBe('見出し.md')
  })
})
