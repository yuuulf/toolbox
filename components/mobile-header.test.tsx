// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MobileHeader } from './mobile-header'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

const items = [{ slug: 'json-formatter', name: 'JSON整形/検証' }]

describe('MobileHeader', () => {
  it('アプリ名のリンクとメニューボタンを持ち、ツールのリンクは閉じたメニューの中にある', () => {
    render(<MobileHeader items={items} />)
    expect(
      screen.getByRole('link', { name: 'toolbox' }).getAttribute('href'),
    ).toBe('/')
    expect(screen.getByRole('button', { name: 'メニューを開く' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'JSON整形/検証' })).toBeNull()
  })

  it('幅 1024px 未満だけで表示する', () => {
    render(<MobileHeader items={items} />)
    expect(screen.getByRole('banner').className.split(' ')).toContain(
      'lg:hidden',
    )
  })
})
