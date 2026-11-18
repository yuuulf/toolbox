// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { ChecklistData } from '@/lib/tools/checklist'
import {
  EMPTY_CHECKLIST,
  addItem,
  removeItem,
  toggleCheck,
} from '@/lib/tools/checklist'
import type { RecurringKind } from '@/lib/tools/checklist-period'
import { RecurringList } from './recurring-list'

// 2026-11-18 は水曜日
const TODAY = new Date(2026, 10, 18)

function Harness({
  kind,
  texts = [],
}: {
  kind: RecurringKind
  texts?: string[]
}) {
  const [data, setData] = useState<ChecklistData>(() =>
    texts.reduce((acc, text) => {
      const result = addItem(acc, kind, text)
      return result.ok ? result.data : acc
    }, EMPTY_CHECKLIST),
  )
  return (
    <RecurringList
      kind={kind}
      list={data[kind]}
      today={TODAY}
      onToggle={(period, id) => setData(toggleCheck(data, kind, period, id))}
      onRemove={(id) => setData(removeItem(data, kind, id))}
      onAdd={(text) => {
        const result = addItem(data, kind, text)
        if (result.ok) setData(result.data)
      }}
    />
  )
}

// date/month 入力は userEvent.type で日付を打てないため、値の変更として発火させる
function changeInput(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe('RecurringList の期間', () => {
  it('初期値は今月・今日を含む週・今日', () => {
    const { unmount } = render(<Harness kind="monthly" />)
    expect(screen.getByLabelText('月')).toHaveValue('2026-11')
    expect(screen.getByLabelText('月')).toHaveAttribute('type', 'month')
    unmount()

    render(<Harness kind="weekly" />)
    expect(screen.getByLabelText('週')).toHaveValue('2026-11-18')
    expect(screen.getByText('11/16（月）〜11/22（日）')).toBeInTheDocument()
  })

  it('日次の初期値は今日', () => {
    render(<Harness kind="daily" />)
    expect(screen.getByLabelText('日')).toHaveValue('2026-11-18')
    expect(screen.getByLabelText('日')).toHaveAttribute('type', 'date')
  })

  it('週次で日曜を選んでも同じ週になり、同じチェック状態が表示される', async () => {
    const user = userEvent.setup()
    render(<Harness kind="weekly" texts={['週報を書く']} />)
    await user.click(screen.getByRole('checkbox', { name: '週報を書く' }))

    changeInput('週', '2026-11-22')
    expect(screen.getByText('11/16（月）〜11/22（日）')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '週報を書く' })).toBeChecked()

    changeInput('週', '2026-11-23')
    expect(screen.getByText('11/23（月）〜11/29（日）')).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: '週報を書く' }),
    ).not.toBeChecked()
  })

  it('入力欄が空や不正な値になっても、直前の期間を使い続ける', async () => {
    const user = userEvent.setup()
    render(<Harness kind="monthly" texts={['請求処理']} />)
    await user.click(screen.getByRole('checkbox', { name: '請求処理' }))
    changeInput('月', '')
    expect(screen.getByRole('checkbox', { name: '請求処理' })).toBeChecked()
  })
})

describe('RecurringList のチェック', () => {
  it('期間を変えるとチェックが別になり、戻すと元のチェックが表示される', async () => {
    const user = userEvent.setup()
    render(<Harness kind="daily" texts={['メールを確認']} />)
    await user.click(screen.getByRole('checkbox', { name: 'メールを確認' }))

    changeInput('日', '2026-11-19')
    expect(
      screen.getByRole('checkbox', { name: 'メールを確認' }),
    ).not.toBeChecked()

    changeInput('日', '2026-11-18')
    expect(screen.getByRole('checkbox', { name: 'メールを確認' })).toBeChecked()
  })

  it('選んでいる期間の完了数を表示する', async () => {
    const user = userEvent.setup()
    render(<Harness kind="weekly" texts={['A', 'B', 'C']} />)
    await user.click(screen.getByRole('checkbox', { name: 'B' }))
    expect(screen.getByText('1/3')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('3件中1件完了')).toHaveClass('sr-only')

    changeInput('週', '2026-11-25')
    expect(screen.getByText('0/3')).toBeInTheDocument()
  })

  it('見出しと追加欄を持ち、追加した項目が末尾に未チェックで加わる', async () => {
    const user = userEvent.setup()
    render(<Harness kind="weekly" texts={['A']} />)
    expect(screen.getByRole('heading', { name: '週次' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('週次の項目'), '週報を書く{Enter}')
    const boxes = screen.getAllByRole('checkbox')
    expect(boxes.map((box) => box.closest('label')?.textContent)).toEqual([
      'A',
      '週報を書く',
    ])
    expect(
      screen.getByRole('checkbox', { name: '週報を書く' }),
    ).not.toBeChecked()
  })
})
