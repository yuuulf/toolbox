import { describe, expect, it } from 'vitest'
import { getTool, tools } from './registry'

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/

describe('ツール登録情報', () => {
  it('slug が重複しない', () => {
    const slugs = tools.map((tool) => tool.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('slug が kebab-case である', () => {
    for (const tool of tools) {
      expect(tool.slug).toMatch(KEBAB_CASE)
    }
  })

  it('すべてのツールに名前・説明・コンポーネントがある', () => {
    for (const tool of tools) {
      expect(tool.name.trim()).not.toBe('')
      expect(tool.description.trim()).not.toBe('')
      expect(typeof tool.component).toBe('function')
    }
  })

  it('7件のツールが登録されている', () => {
    expect(tools.map((tool) => tool.slug)).toEqual([
      'json-formatter',
      'char-counter',
      'id-generator',
      'color-tool',
      'checklist',
      'text-diff',
      'markdown-preview',
    ])
  })
})

describe('getTool', () => {
  it('登録済みの slug でツールを返す', () => {
    expect(getTool('char-counter')?.name).toBe('文字数カウント')
  })

  it('未登録の slug では undefined を返す', () => {
    expect(getTool('does-not-exist')).toBeUndefined()
  })
})
