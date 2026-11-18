// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FavoriteColors } from './favorite-colors'

function setup(favorites: string[]) {
  const onSelect = vi.fn()
  const onRemove = vi.fn()
  render(
    <FavoriteColors
      favorites={favorites}
      onSelect={onSelect}
      onRemove={onRemove}
      countId="count"
    />,
  )
  return { onSelect, onRemove, user: userEvent.setup() }
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

  it('削除ボタンを押すと onRemove にその HEX が渡る', async () => {
    const { onRemove, user } = setup(['#ff0000', '#336699'])
    await user.click(screen.getByRole('button', { name: '#336699 を削除' }))
    expect(onRemove).toHaveBeenCalledWith('#336699')
  })

  it('キーボードだけで選択と削除ができる', async () => {
    const { onSelect, onRemove, user } = setup(['#ff0000'])
    await user.tab()
    expect(screen.getByRole('button', { name: '#ff0000' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith('#ff0000')

    await user.tab()
    expect(screen.getByRole('button', { name: '#ff0000 を削除' })).toHaveFocus()
    await user.keyboard(' ')
    expect(onRemove).toHaveBeenCalledWith('#ff0000')
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
