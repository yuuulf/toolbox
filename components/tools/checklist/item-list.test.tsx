// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ItemView } from './item-list'
import { ItemList } from './item-list'

const ITEMS: ItemView[] = [
  { id: 'a', text: '週報を書く', checked: false },
  { id: 'b', text: '振り返り', checked: true },
]

function setup(items = ITEMS) {
  const onToggle = vi.fn()
  const onRemove = vi.fn()
  render(<ItemList items={items} onToggle={onToggle} onRemove={onRemove} />)
  return { onToggle, onRemove, user: userEvent.setup() }
}

describe('ItemList', () => {
  it('項目のテキストをラベルにしたチェックボックスで状態を表示する', () => {
    setup()
    expect(
      screen.getByRole('checkbox', { name: '週報を書く' }),
    ).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: '振り返り' })).toBeChecked()
  })

  it('チェックボックスを押すと onToggle に ID が渡る', async () => {
    const { onToggle, user } = setup()
    await user.click(screen.getByRole('checkbox', { name: '週報を書く' }))
    expect(onToggle).toHaveBeenCalledWith('a')
  })

  it('「<項目> を削除」で onRemove に ID が渡る', async () => {
    const { onRemove, user } = setup()
    await user.click(screen.getByRole('button', { name: '振り返り を削除' }))
    expect(onRemove).toHaveBeenCalledWith('b')
  })

  it('キーボードだけでチェックと削除ができる', async () => {
    const { onToggle, onRemove, user } = setup([ITEMS[0]])
    await user.tab()
    expect(screen.getByRole('checkbox', { name: '週報を書く' })).toHaveFocus()
    await user.keyboard(' ')
    expect(onToggle).toHaveBeenCalledWith('a')
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onRemove).toHaveBeenCalledWith('a')
  })

  it('項目がないときは、まだないことを表示する', () => {
    setup([])
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText('項目はまだありません。')).toBeInTheDocument()
  })
})
