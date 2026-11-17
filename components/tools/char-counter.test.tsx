// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CharCounter } from './char-counter'

// dt（ラベル）に対応する dd（値）を返す
function countOf(label: string): string {
  const term = screen.getByText(label, { selector: 'dt' })
  return within(term.parentElement as HTMLElement).getByRole('definition')
    .textContent as string
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CharCounter', () => {
  it('初期表示ではすべて 0', () => {
    render(<CharCounter />)
    expect(countOf('文字数')).toBe('0')
    expect(countOf('空白を除いた文字数')).toBe('0')
    expect(countOf('行数')).toBe('0')
    expect(countOf('バイト数（UTF-8）')).toBe('0')
  })

  it('入力するたびにカウントを更新する', async () => {
    const user = userEvent.setup()
    render(<CharCounter />)
    const textarea = screen.getByLabelText('テキスト')

    await user.type(textarea, 'a')
    expect(countOf('文字数')).toBe('1')

    await user.type(textarea, ' あ{Enter}b')
    expect(countOf('文字数')).toBe('5')
    expect(countOf('空白を除いた文字数')).toBe('3')
    expect(countOf('行数')).toBe('2')
    expect(countOf('バイト数（UTF-8）')).toBe('7')
  })

  it('入力テキストを localStorage に保存しない', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const user = userEvent.setup()
    render(<CharCounter />)
    await user.type(screen.getByLabelText('テキスト'), 'ひみつ')
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
  })
})
