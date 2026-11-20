// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FavoriteColors } from './favorite-colors'

function setup(favorites: string[]) {
  const onSelect = vi.fn()
  render(
    <FavoriteColors
      favorites={favorites}
      onSelect={onSelect}
      countId="count"
    />,
  )
  return { onSelect, user: userEvent.setup() }
}

describe('FavoriteColors', () => {
  it('お気に入りを登録した順に色見本と HEX で表示する', () => {
    setup(['#ff0000', '#336699'])
    const items = screen.getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual([
      '#ff0000',
      '#336699',
    ])
  })

  it('一覧の色を選ぶと onSelect にその HEX が渡る', async () => {
    const { onSelect, user } = setup(['#ff0000', '#336699'])
    await user.click(screen.getByRole('button', { name: '#336699' }))
    expect(onSelect).toHaveBeenCalledWith('#336699')
  })

  it('各色には色見本のボタンとコピーボタンだけを置き、削除のボタンは置かない', () => {
    setup(['#ff0000', '#336699'])
    for (const item of screen.getAllByRole('listitem')) {
      expect(within(item).getAllByRole('button')).toHaveLength(2)
    }
    expect(screen.queryByRole('button', { name: /削除/ })).toBeNull()
  })

  it('コピーボタンを押すとその HEX をコピーし、変換欄には読み込まない', async () => {
    const { onSelect, user } = setup(['#ff0000', '#336699'])
    const copy = screen.getByRole('button', { name: '#336699 をコピー' })
    await user.click(copy)
    expect(await navigator.clipboard.readText()).toBe('#336699')
    expect(copy.querySelector('svg')?.getAttribute('data-icon')).toBe('check')
    expect(screen.getByText('コピーしました')).toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('キーボードだけで選択とコピーができる', async () => {
    const { onSelect, user } = setup(['#ff0000'])
    await user.tab()
    expect(screen.getByRole('button', { name: '#ff0000' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith('#ff0000')

    await user.tab()
    expect(
      screen.getByRole('button', { name: '#ff0000 をコピー' }),
    ).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(await navigator.clipboard.readText()).toBe('#ff0000')
  })

  it('お気に入りがないときは、0/10 とまだ登録がないことを表示する', () => {
    setup([])
    expect(screen.getByText('0/10')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText(/お気に入りはまだありません/)).toBeInTheDocument()
  })

  it('見出しの行に件数を表示し、読み上げ用の文言も置く', () => {
    setup(['#111111', '#222222', '#333333'])
    const heading = screen.getByRole('heading', { name: 'お気に入り' })
    const row = heading.parentElement as HTMLElement
    expect(row).toHaveTextContent('3/10')
    expect(screen.getByText('3/10')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('10件中3件')).toHaveClass('sr-only')
    expect(
      screen.queryByText('不要な色を削除してください。'),
    ).not.toBeInTheDocument()
  })

  it('上限のときは 10/10 だけを表示し、上限を知らせる文は出さない', () => {
    setup(Array.from({ length: 10 }, (_, i) => `#00000${i}`))
    expect(screen.getByText('10/10')).toBeInTheDocument()
    expect(screen.queryByText(/不要な色|上限/)).not.toBeInTheDocument()
  })

  it('読み上げ用の件数に id を付け、読み上げ対象にする', () => {
    setup(['#ff0000'])
    const count = screen.getByText('10件中1件')
    expect(count).toHaveAttribute('id', 'count')
    expect(count).toHaveAttribute('aria-live', 'polite')
  })
})
