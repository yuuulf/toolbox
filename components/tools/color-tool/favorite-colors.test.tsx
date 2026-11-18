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

  it('お気に入りがないときは、まだ登録がないことを表示する', () => {
    setup([])
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText(/お気に入りはまだありません/)).toBeInTheDocument()
  })
})
