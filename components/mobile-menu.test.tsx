// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePathname } from 'next/navigation'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MobileMenu } from './mobile-menu'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}))

const items = [
  { slug: 'json-formatter', name: 'JSON整形/検証' },
  { slug: 'char-counter', name: '文字数カウント' },
]

// jsdom の <dialog> は showModal() / close() を持たないので、open 属性の付け外しと close イベントだけを行う代わりを入れる
// （フォーカスの閉じ込めと Esc キーはブラウザの機能なので、ブラウザで確かめる）
beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue('/')
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

const menuButton = () => screen.getByRole('button', { name: 'メニューを開く' })

describe('MobileMenu', () => {
  it('開く前はツールのリンクが表示されていない', () => {
    render(<MobileMenu items={items} />)
    expect(menuButton().getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('link', { name: '文字数カウント' })).toBeNull()
  })

  it('メニューボタンで開くと、ツールのリンクが表示される', async () => {
    const user = userEvent.setup()
    render(<MobileMenu items={items} />)
    await user.click(menuButton())
    expect(menuButton().getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('dialog', { name: 'ツール' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '文字数カウント' })).toBeTruthy()
    const dialogId = menuButton().getAttribute('aria-controls')
    expect(screen.getByRole('dialog').id).toBe(dialogId)
  })

  it('閉じるボタンで閉じる', async () => {
    const user = userEvent.setup()
    render(<MobileMenu items={items} />)
    await user.click(menuButton())
    await user.click(screen.getByRole('button', { name: 'メニューを閉じる' }))
    expect(menuButton().getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('link', { name: '文字数カウント' })).toBeNull()
  })

  it('ツールのリンクを選ぶと閉じる', async () => {
    const user = userEvent.setup()
    render(<MobileMenu items={items} />)
    await user.click(menuButton())
    fireEvent.click(screen.getByRole('link', { name: '文字数カウント' }))
    expect(menuButton().getAttribute('aria-expanded')).toBe('false')
  })

  it('Esc キーなどで閉じた（close イベント）ときも状態が戻る', async () => {
    const user = userEvent.setup()
    render(<MobileMenu items={items} />)
    await user.click(menuButton())
    const dialog = screen.getByRole('dialog') as HTMLDialogElement
    act(() => dialog.close())
    expect(menuButton().getAttribute('aria-expanded')).toBe('false')
  })
})
