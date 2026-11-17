// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CopyButton } from './copy-button'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CopyButton', () => {
  it('テキストをクリップボードに書き込み、「コピーしました」と表示する', async () => {
    const user = userEvent.setup()
    render(<CopyButton text="hello" />)

    await user.click(screen.getByRole('button', { name: 'コピー' }))

    expect(await navigator.clipboard.readText()).toBe('hello')
    expect(screen.getByText('コピーしました')).toBeInTheDocument()
  })

  it('書き込みに失敗したら「コピーできませんでした」と表示する', async () => {
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

  it('ボタンの文言を指定できる', () => {
    render(<CopyButton text="x" label="パスワードをコピー" />)
    expect(
      screen.getByRole('button', { name: 'パスワードをコピー' }),
    ).toBeInTheDocument()
  })

  it('結果の表示は読み上げ対象（aria-live）になっている', async () => {
    const user = userEvent.setup()
    render(<CopyButton text="hello" />)
    await user.click(screen.getByRole('button', { name: 'コピー' }))
    expect(screen.getByText('コピーしました')).toHaveAttribute(
      'aria-live',
      'polite',
    )
  })
})
