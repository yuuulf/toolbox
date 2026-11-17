// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CopyButton } from './copy-button'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function iconOf(button: HTMLElement) {
  return button.querySelector('svg')?.getAttribute('data-icon')
}

describe('CopyButton', () => {
  it('テキストをクリップボードに書き込み、「コピーしました」と読み上げる', async () => {
    const user = userEvent.setup()
    render(<CopyButton text="hello" />)

    await user.click(screen.getByRole('button', { name: 'コピー' }))

    expect(await navigator.clipboard.readText()).toBe('hello')
    expect(screen.getByText('コピーしました')).toBeInTheDocument()
  })

  it('書き込みに失敗したら「コピーできませんでした」と読み上げる', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new DOMException('denied', 'NotAllowedError'),
    )
    render(<CopyButton text="hello" />)

    await user.click(screen.getByRole('button', { name: 'コピー' }))

    expect(screen.getByText('コピーできませんでした')).toBeInTheDocument()
  })

  it('コピーする内容がないときは押せない', () => {
    render(<CopyButton text="" />)
    expect(screen.getByRole('button', { name: 'コピー' })).toBeDisabled()
  })

  it('ボタンの名前を指定できる', () => {
    render(<CopyButton text="x" label="パスワードをコピー" />)
    expect(
      screen.getByRole('button', { name: 'パスワードをコピー' }),
    ).toBeInTheDocument()
  })

  it('ボタンには文字を表示せず、名前をツールチップで示す', () => {
    render(<CopyButton text="x" label="パスワードをコピー" />)
    const button = screen.getByRole('button', { name: 'パスワードをコピー' })
    expect(button).toHaveTextContent(/^$/)
    expect(button).toHaveAttribute('title', 'パスワードをコピー')
  })

  it('結果の表示は読み上げ対象（aria-live）で、画面からは隠れている', async () => {
    const user = userEvent.setup()
    render(<CopyButton text="hello" />)
    await user.click(screen.getByRole('button', { name: 'コピー' }))
    const message = screen.getByText('コピーしました')
    expect(message).toHaveAttribute('aria-live', 'polite')
    expect(message).toHaveClass('sr-only')
  })

  it('成功するとアイコンがチェックに変わり、約2秒後にコピーアイコンへ戻る', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<CopyButton text="hello" />)
    const button = screen.getByRole('button', { name: 'コピー' })
    expect(iconOf(button)).toBe('copy')

    await user.click(button)
    expect(iconOf(button)).toBe('check')

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(iconOf(button)).toBe('copy')
    expect(screen.queryByText('コピーしました')).not.toBeInTheDocument()
  })

  it('失敗するとアイコンが×に変わる', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new DOMException('denied', 'NotAllowedError'),
    )
    render(<CopyButton text="hello" />)
    const button = screen.getByRole('button', { name: 'コピー' })

    await user.click(button)

    expect(iconOf(button)).toBe('x')
  })

  it('Tab でフォーカスして Enter でコピーできる', async () => {
    const user = userEvent.setup()
    render(<CopyButton text="hello" />)

    await user.tab()
    expect(screen.getByRole('button', { name: 'コピー' })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(await navigator.clipboard.readText()).toBe('hello')
    expect(screen.getByText('コピーしました')).toBeInTheDocument()
  })
})
