'use client'

import { useDeferredValue, useId, useState, useSyncExternalStore } from 'react'
import { loadDraft, saveDraft } from '@/lib/tools/markdown-preview'
import { MarkdownView } from './markdown-view'
import type { ViewMode } from './view-mode-switch'
import { ViewModeSwitch } from './view-mode-switch'

type SaveStatus = 'saved' | 'failed' | null

const noopSubscribe = () => () => {}

// 保存した Markdown はブラウザでだけ読める（ページはビルド時にプリレンダーされる）。
// サーバーとハイドレーション中は null を返し、読めるようになったら入力欄を保存値で作り直す
export function MarkdownPreview() {
  const saved = useSyncExternalStore(noopSubscribe, loadDraft, () => null)
  return (
    <Editor
      key={saved === null ? 'server' : 'client'}
      initialMarkdown={saved ?? ''}
      ready={saved !== null}
    />
  )
}

type EditorProps = {
  initialMarkdown: string
  /** 保存値を読み終えたか。読み終えるまでは入力と保存をできなくする */
  ready: boolean
}

function Editor({ initialMarkdown, ready }: EditorProps) {
  const inputId = useId()
  const [markdown, setMarkdown] = useState(initialMarkdown)
  const [mode, setMode] = useState<ViewMode>('split')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(null)
  // 入力欄への反映は即時にし、プレビューの描画は後回しにできるようにする
  const deferredMarkdown = useDeferredValue(markdown)

  function handleChange(value: string) {
    setMarkdown(value)
    setSaveStatus(null)
  }

  function handleSave() {
    setSaveStatus(saveDraft(markdown) ? 'saved' : 'failed')
  }

  const showEditor = mode !== 'preview'
  const showPreview = mode !== 'editor'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <ViewModeSwitch value={mode} onChange={setMode} />
        <button
          type="button"
          onClick={handleSave}
          disabled={!ready}
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          保存
        </button>
        <p
          aria-live="polite"
          className="text-sm text-zinc-600 dark:text-zinc-400"
        >
          {saveStatus === 'saved' && '保存しました。'}
          {saveStatus === 'failed' && '保存できませんでした。'}
        </p>
      </div>

      {/* 並べて表示は lg 以上で左右に、それ未満では縦に並べる。片方だけのときは幅いっぱいに使う */}
      <div
        className={
          mode === 'split'
            ? 'flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-x-6'
            : 'flex flex-col'
        }
      >
        {showEditor && (
          <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor={inputId} className="text-sm font-medium">
              Markdown
            </label>
            <textarea
              id={inputId}
              value={markdown}
              onChange={(e) => handleChange(e.target.value)}
              disabled={!ready}
              spellCheck={false}
              className="h-108 w-full resize-none rounded-md border border-zinc-300 bg-transparent p-2 font-mono text-sm dark:border-zinc-700"
            />
          </div>
        )}
        {showPreview && (
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-sm font-medium">プレビュー</h2>
            {/* 長いプレビューはこの欄の中でスクロールする。キーボードでもスクロールできるようフォーカス可能にする。
                relative は、中の sr-only などの絶対配置がこの欄の外へはみ出してページを伸ばさないため */}
            <div
              role="region"
              aria-label="プレビュー"
              tabIndex={0}
              className="relative h-108 overflow-y-auto rounded-md border border-zinc-300 p-3 dark:border-zinc-700"
            >
              <MarkdownView markdown={deferredMarkdown} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
