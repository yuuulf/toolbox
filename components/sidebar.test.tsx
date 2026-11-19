// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Sidebar } from './sidebar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/tools/char-counter',
}))

const items = [
  { slug: 'json-formatter', name: 'JSON整形/検証' },
  { slug: 'char-counter', name: '文字数カウント' },
]

describe('Sidebar', () => {
  it('アプリ名のリンクと、現在地を強調したツール一覧を持つ', () => {
    render(<Sidebar items={items} />)
    expect(
      screen.getByRole('link', { name: 'toolbox' }).getAttribute('href'),
    ).toBe('/')
    expect(screen.getByRole('navigation', { name: 'ツール' })).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: '文字数カウント' })
        .getAttribute('aria-current'),
    ).toBe('page')
  })

  it('幅 1024px 以上だけで表示する', () => {
    render(<Sidebar items={items} />)
    const aside = screen.getByRole('complementary')
    expect(aside.className.split(' ')).toEqual(
      expect.arrayContaining(['hidden', 'lg:flex']),
    )
  })
})
