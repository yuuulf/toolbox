// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OutputView } from './output-view'

function renderWithHeading(value: string) {
  render(
    <>
      <h2 id="out">出力</h2>
      <OutputView value={value} labelId="out" />
    </>,
  )
}

describe('OutputView', () => {
  it('見出しの名前の付いた表示領域として扱われ、テキスト入力欄ではない', () => {
    renderWithHeading('abc')
    expect(screen.getByRole('region', { name: '出力' })).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('キーボードでフォーカスしてスクロールできる', () => {
    renderWithHeading('abc')
    expect(screen.getByRole('region', { name: '出力' }).tabIndex).toBe(0)
  })

  it('改行とタブをそのまま表示する', () => {
    renderWithHeading('{\n\t"a": 1\n}')
    const region = screen.getByRole('region', { name: '出力' })
    expect(region.textContent).toBe('{\n\t"a": 1\n}')
    expect(region.className).toContain('whitespace-pre')
  })

  it('値が空でも表示領域を表示する', () => {
    renderWithHeading('')
    expect(screen.getByRole('region', { name: '出力' }).textContent).toBe('')
  })
})
