// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Header } from './header'

describe('Header', () => {
  it('トップへのリンクは「toolbox」と読み上げられ、アイコンは読み上げ対象にならない', () => {
    render(<Header />)
    const link = screen.getByRole('link', { name: 'toolbox' })
    expect(link.getAttribute('href')).toBe('/')
    // alt="" の画像は presentation 扱いになり、img ロールとしては取得できない
    expect(screen.queryAllByRole('img')).toHaveLength(0)
  })

  it('リンクの中に、OS のライト/ダーク設定で切り替わるアイコンが2枚ある', () => {
    render(<Header />)
    const icons = screen.getByRole('link').querySelectorAll('img')
    expect(icons).toHaveLength(2)
    const [light, dark] = icons
    expect(light.getAttribute('alt')).toBe('')
    expect(dark.getAttribute('alt')).toBe('')
    expect(light.getAttribute('src')).toContain('favicon-light')
    expect(dark.getAttribute('src')).toContain('favicon-dark')
    expect(light.className.split(' ')).toContain('dark:hidden')
    expect(dark.className.split(' ')).toEqual(
      expect.arrayContaining(['hidden', 'dark:block']),
    )
  })

  it('ポインタを重ねても下線を出さない', () => {
    render(<Header />)
    expect(screen.getByRole('link').className).not.toContain('underline')
  })
})
