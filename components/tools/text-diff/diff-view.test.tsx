// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { compareTexts } from '@/lib/tools/text-diff'
import { DiffView } from './diff-view'

function renderDiff(before: string, after: string) {
  const result = compareTexts(before, after)
  if (!result.ok) throw new Error(result.reason)
  const { container } = render(<DiffView rows={result.rows} />)
  const [sideBySide, unified] = container.firstElementChild!.children
  return { sideBySide, unified }
}

// 1行の見た目（行番号・記号・内容）をまとめて取り出す
function lineText(line: Element | undefined) {
  if (!line || line.children.length === 0) return null
  const [number, symbol] = line.children
  const content = line.lastElementChild!
  return `${number.textContent}${symbol.textContent}${content.textContent}`
}

describe('DiffView', () => {
  it('左右に並べ、片側にしかない行の反対側は空ける', () => {
    const { sideBySide } = renderDiff('a\nb', 'a\nB\nc')
    const rows = [...sideBySide.children].map((row) =>
      [...row.children].map(lineText),
    )
    expect(rows).toEqual([
      ['1 a', '1 a'],
      ['2-b', '2+B'],
      [null, '3+c'],
    ])
  })

  it('変わった文字は消えた側が del、加わった側が ins で囲まれる', () => {
    const { sideBySide } = renderDiff('価格は100円', '価格は120円')
    expect(
      [...sideBySide.querySelectorAll('del')].map((e) => e.textContent),
    ).toEqual(['0'])
    expect(
      [...sideBySide.querySelectorAll('ins')].map((e) => e.textContent),
    ).toEqual(['2'])
  })

  it('記号と行番号は読み上げず、「追加」「削除」を読み上げ用に置く', () => {
    const { sideBySide } = renderDiff('a', 'b')
    const [before, after] = sideBySide.firstElementChild!.children
    for (const line of [before, after]) {
      const [number, symbol] = line.children
      expect(number.getAttribute('aria-hidden')).toBe('true')
      expect(symbol.getAttribute('aria-hidden')).toBe('true')
    }
    expect(before.querySelector('.sr-only')?.textContent).toBe('削除')
    expect(after.querySelector('.sr-only')?.textContent).toBe('追加')
  })

  it('共通の行には「追加」「削除」の読み上げを付けない', () => {
    const { sideBySide } = renderDiff('a\nb', 'a\nc')
    const firstRow = sideBySide.firstElementChild!
    expect(firstRow.querySelector('.sr-only')).toBeNull()
  })

  it('1列表示は、共通の行を1回、変更された行は削除の後に追加を並べる', () => {
    const { unified } = renderDiff('a\nb\nx', 'a\nc\nx\nd')
    expect([...unified.children].map(lineText)).toEqual([
      '1 a',
      '2-b',
      '2+c',
      '3 x',
      '4+d',
    ])
  })

  it('左右表示は狭い画面で隠し、1列表示は広い画面で隠す', () => {
    const { sideBySide, unified } = renderDiff('a', 'b')
    expect(sideBySide.className.split(' ')).toEqual(
      expect.arrayContaining(['hidden', 'sm:block']),
    )
    expect(unified.className.split(' ')).toContain('sm:hidden')
  })
})
