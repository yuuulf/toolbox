'use client'

import type { FormEvent } from 'react'
import { useId, useState } from 'react'
import { MAX_ITEMS, MAX_TEXT_LENGTH } from '@/lib/tools/checklist'

type Props = {
  /** 「月次」など。入力欄の読み上げ用ラベルに使う */
  listLabel: string
  itemCount: number
  onAdd: (text: string) => void
}

export function AddItemForm({ listLabel, itemCount, onAdd }: Props) {
  const inputId = useId()
  const [text, setText] = useState('')
  const isFull = itemCount >= MAX_ITEMS
  const canAdd = text.trim() !== '' && !isFull

  // Enter でも追加できるよう form の submit で受ける（そのため追加ボタンは type="submit"）
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canAdd) return
    onAdd(text)
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">
          {listLabel}の項目
        </label>
        <input
          id={inputId}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_TEXT_LENGTH}
          placeholder="項目を追加"
          autoComplete="off"
          className="w-full min-w-0 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
        />
        <button
          type="submit"
          disabled={!canAdd}
          className="shrink-0 rounded-md bg-zinc-900 px-3 py-1 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          追加
        </button>
      </div>
      <p
        aria-live="polite"
        className="text-xs text-zinc-600 dark:text-zinc-400"
      >
        {isFull ? `項目は${MAX_ITEMS}件までです。` : ''}
      </p>
    </form>
  )
}
