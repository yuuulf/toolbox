'use client'

import { useId, useState } from 'react'
import type { RecurringList as RecurringListData } from '@/lib/tools/checklist'
import type { RecurringKind } from '@/lib/tools/checklist-period'
import {
  dayKey,
  formatWeekRange,
  monthKey,
  parseDateInput,
  parseMonthInput,
  periodKey,
} from '@/lib/tools/checklist-period'
import { AddItemForm } from './add-item-form'
import { CompletionCount } from './completion-count'
import { ItemList } from './item-list'

const LABELS: Record<RecurringKind, { title: string; period: string }> = {
  monthly: { title: '月次', period: '月' },
  weekly: { title: '週次', period: '週' },
  daily: { title: '日次', period: '日' },
}

type Props = {
  kind: RecurringKind
  list: RecurringListData
  /** 期間の初期値（今月・今週・今日）の基準。ブラウザで決めた日付を渡す */
  today: Date
  onToggle: (period: string, id: string) => void
  onRemove: (id: string) => void
  onAdd: (text: string) => void
}

export function RecurringList({
  kind,
  list,
  today,
  onToggle,
  onRemove,
  onAdd,
}: Props) {
  const inputId = useId()
  const { title, period: periodLabel } = LABELS[kind]
  // 入力欄の値と、直前に正しかった期間のキーを別に持つ。
  // 日付を消したときや、month 入力に対応していないブラウザで書きかけのときも、表示中の期間を保つため
  const [inputValue, setInputValue] = useState(
    kind === 'monthly' ? monthKey(today) : dayKey(today),
  )
  const [period, setPeriod] = useState(periodKey(kind, today))

  function handlePeriodChange(value: string) {
    setInputValue(value)
    if (kind === 'monthly') {
      const month = parseMonthInput(value)
      if (month) setPeriod(month)
      return
    }
    const date = parseDateInput(value)
    if (date) setPeriod(periodKey(kind, date))
  }

  const checked = new Set(list.checks[period] ?? [])
  const items = list.items.map((item) => ({
    ...item,
    checked: checked.has(item.id),
  }))

  return (
    // 広い画面では、30件のときの高さ（一覧が max-h-112）を最低にして、画面の下端まで広がる。
    // 一覧はこの中で中身の高さのまま伸び、追加の入力欄は一覧のすぐ下に来る
    <section className="flex flex-col gap-3 lg:min-h-159 lg:contain-size">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <CompletionCount
          done={items.filter((item) => item.checked).length}
          total={items.length}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium">
          {periodLabel}
        </label>
        <input
          id={inputId}
          type={kind === 'monthly' ? 'month' : 'date'}
          value={inputValue}
          onChange={(e) => handlePeriodChange(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
        />
        {kind === 'weekly' && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {formatWeekRange(period)}
          </p>
        )}
      </div>
      <ItemList
        items={items}
        onToggle={(id) => onToggle(period, id)}
        onRemove={onRemove}
      />
      <AddItemForm
        listLabel={title}
        itemCount={list.items.length}
        onAdd={onAdd}
      />
    </section>
  )
}
