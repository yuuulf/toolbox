// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { ChecklistData } from '@/lib/tools/checklist'
import {
  EMPTY_CHECKLIST,
  addItem,
  removeCheckedTemporary,
  removeItem,
  toggleTemporary,
} from '@/lib/tools/checklist'
import { TemporaryList } from './temporary-list'

function Harness({ texts }: { texts: string[] }) {
  const [data, setData] = useState<ChecklistData>(() =>
    texts.reduce((acc, text) => {
      const result = addItem(acc, 'temporary', text)
      return result.ok ? result.data : acc
    }, EMPTY_CHECKLIST),
  )
  return (
    <TemporaryList
      items={data.temporary.items}
      onToggle={(id) => setData(toggleTemporary(data, id))}
      onRemove={(id) => setData(removeItem(data, 'temporary', id))}
      onAdd={(text) => {
        const result = addItem(data, 'temporary', text)
        if (result.ok) setData(result.data)
      }}
      onRemoveChecked={() => setData(removeCheckedTemporary(data))}
    />
  )
}

const removeChecked = () =>
  screen.getByRole('button', { name: 'チェック済みを削除' })

describe('TemporaryList', () => {
  it('見出し「一時」と完了数を表示する', async () => {
    const user = userEvent.setup()
    render(<Harness texts={['A', 'B']} />)
    expect(screen.getByRole('heading', { name: '一時' })).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'A' }))
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('チェック済みの項目をまとめて削除し、チェックしていない項目だけが残る', async () => {
    const user = userEvent.setup()
    render(<Harness texts={['A', 'B', 'C']} />)
    await user.click(screen.getByRole('checkbox', { name: 'A' }))
    await user.click(screen.getByRole('checkbox', { name: 'C' }))
    await user.click(removeChecked())
    expect(
      screen
        .getAllByRole('checkbox')
        .map((box) => box.closest('label')?.textContent),
    ).toEqual(['B'])
  })

  it('チェック済みの項目がないときは「チェック済みを削除」を押せない', () => {
    render(<Harness texts={['A']} />)
    expect(removeChecked()).toBeDisabled()
  })

  it('項目を追加・個別に削除できる', async () => {
    const user = userEvent.setup()
    render(<Harness texts={[]} />)
    await user.type(screen.getByLabelText('一時の項目'), '牛乳を買う{Enter}')
    expect(
      screen.getByRole('checkbox', { name: '牛乳を買う' }),
    ).not.toBeChecked()
    await user.click(screen.getByRole('button', { name: '牛乳を買う を削除' }))
    expect(screen.getByText('項目はまだありません。')).toBeInTheDocument()
  })
})
