// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { describe, expect, it, vi } from 'vitest'
import { ToolNav } from './tool-nav'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

const items = [
  { slug: 'json-formatter', name: 'JSON整形/検証' },
  { slug: 'char-counter', name: '文字数カウント' },
  { slug: 'id-generator', name: 'UUID/パスワード生成' },
]

describe('ToolNav', () => {
  it('すべてのツールへのリンクを表示する', () => {
    vi.mocked(usePathname).mockReturnValue('/')
    render(<ToolNav items={items} />)

    const nav = screen.getByRole('navigation', { name: 'ツール' })
    expect(nav).toBeInTheDocument()
    for (const item of items) {
      expect(screen.getByRole('link', { name: item.name })).toHaveAttribute(
        'href',
        `/tools/${item.slug}`,
      )
    }
  })

  it('表示中のツールだけを現在地として強調する', () => {
    vi.mocked(usePathname).mockReturnValue('/tools/id-generator')
    render(<ToolNav items={items} />)

    expect(
      screen.getByRole('link', { name: 'UUID/パスワード生成' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      screen.getByRole('link', { name: 'JSON整形/検証' }),
    ).not.toHaveAttribute('aria-current')
  })

  it('末尾に / が付いたパスでも現在地として強調する', () => {
    vi.mocked(usePathname).mockReturnValue('/tools/id-generator/')
    render(<ToolNav items={items} />)

    expect(
      screen.getByRole('link', { name: 'UUID/パスワード生成' }),
    ).toHaveAttribute('aria-current', 'page')
  })

  it('トップページではどのツールも強調しない', () => {
    vi.mocked(usePathname).mockReturnValue('/')
    render(<ToolNav items={items} />)

    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current')
    }
  })

  it('リンクを押すと onNavigate を呼ぶ', async () => {
    vi.mocked(usePathname).mockReturnValue('/')
    const onNavigate = vi.fn()
    render(<ToolNav items={items} onNavigate={onNavigate} />)
    // jsdom は遷移しないので、クリックで呼ばれることだけを確かめる
    fireEvent.click(screen.getByRole('link', { name: '文字数カウント' }))
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })
})
