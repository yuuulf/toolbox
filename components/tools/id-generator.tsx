'use client'

import { useId, useState, useSyncExternalStore } from 'react'
import { CopyButton } from '@/components/copy-button'
import type { CharsetKey, PasswordOptions } from '@/lib/tools/id-generate'
import {
  DEFAULT_PASSWORD_OPTIONS,
  generatePassword,
  generateUuids,
  loadPasswordOptions,
  PASSWORD_LENGTH_MAX,
  PASSWORD_LENGTH_MIN,
  savePasswordOptions,
  UUID_COUNT_MAX,
  UUID_COUNT_MIN,
} from '@/lib/tools/id-generate'

// UUID の生成結果の欄の行数。件数に合わせて伸ばし、上限を超えたら欄の中でスクロールする。
// 上限は 1470×800 で縦スクロールが出ない高さ（100件を生成した状態で測って決めた）
const UUID_ROWS_MIN = 3
const UUID_ROWS_MAX = 20

const CHARSET_LABELS: { key: CharsetKey; label: string }[] = [
  { key: 'upper', label: '英大文字（A-Z）' },
  { key: 'lower', label: '英小文字（a-z）' },
  { key: 'digits', label: '数字（0-9）' },
  { key: 'symbols', label: '記号' },
]

const primaryButton =
  'rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300'
const inputClass =
  'w-24 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700'
const errorText = 'text-sm text-red-700 dark:text-red-400'

export function IdGenerator() {
  // 広い画面では2つのセクションを左右に並べ、1画面に収める。
  // 各セクションを4行（見出し・入力欄とボタン・補足・結果欄）の subgrid にして、左右で行の高さを共有し、
  // 入力欄・ボタン・結果欄の位置をそろえる
  return (
    // 広い画面では、2つの列の行（見出し・操作・メッセージ・結果）をそろえ、最後の結果の行を画面の下端まで広げる。
    // 「最後の行だけ残りの高さ」という行の組み方は Tailwind の既定のクラスにないので、行の指定だけ任意値で書く
    <div className="flex flex-col gap-10 lg:grid lg:flex-1 lg:grid-cols-2 lg:grid-rows-[auto_auto_auto_1fr] lg:gap-x-8 lg:gap-y-3">
      <UuidSection />
      <PasswordSection />
    </div>
  )
}

function UuidSection() {
  const countId = useId()
  const outputId = useId()
  const [countText, setCountText] = useState(String(UUID_COUNT_MIN))
  const [uuids, setUuids] = useState<string[]>([])

  const count = Number(countText)
  const isValidCount =
    countText.trim() !== '' &&
    Number.isInteger(count) &&
    count >= UUID_COUNT_MIN &&
    count <= UUID_COUNT_MAX

  function handleGenerate() {
    const result = generateUuids(count)
    if (result.ok) setUuids(result.uuids)
  }

  const output = uuids.join('\n')

  return (
    <section className="flex flex-col gap-3 lg:row-span-4 lg:grid lg:grid-rows-subgrid">
      <h2 className="text-lg font-semibold">UUID v4</h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={countId} className="text-sm font-medium">
            個数
          </label>
          <input
            id={countId}
            type="number"
            inputMode="numeric"
            min={UUID_COUNT_MIN}
            max={UUID_COUNT_MAX}
            value={countText}
            onChange={(e) => setCountText(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!isValidCount}
          className={primaryButton}
        >
          UUID を生成
        </button>
      </div>
      <p aria-live="polite" className={errorText}>
        {isValidCount
          ? ''
          : `個数は ${UUID_COUNT_MIN}〜${UUID_COUNT_MAX} の範囲で指定してください。`}
      </p>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={outputId} className="text-sm font-medium">
            生成結果
          </label>
          <CopyButton text={output} label="UUID をコピー" />
        </div>
        <textarea
          id={outputId}
          value={output}
          readOnly
          rows={Math.min(Math.max(uuids.length, UUID_ROWS_MIN), UUID_ROWS_MAX)}
          spellCheck={false}
          // rows の高さを最低にして、広い画面では結果の行の残りの高さを埋める
          className="w-full rounded-md border border-zinc-300 bg-zinc-50 p-2 font-mono text-sm lg:flex-1 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
    </section>
  )
}

// パスワード設定の保存先（localStorage）を外部ストアとして扱う。
// サーバーとハイドレーション時は既定値、ブラウザでは保存済みの値を返す。
// localStorage に書けない環境でも、メモリ上の値で設定変更は効く（保存されないだけ）
let currentOptions: PasswordOptions | undefined
const optionListeners = new Set<() => void>()

const passwordOptionsStore = {
  subscribe(listener: () => void) {
    optionListeners.add(listener)
    return () => {
      optionListeners.delete(listener)
    }
  },
  getSnapshot(): PasswordOptions {
    currentOptions ??= loadPasswordOptions()
    return currentOptions
  },
  getServerSnapshot(): PasswordOptions {
    return DEFAULT_PASSWORD_OPTIONS
  },
  set(next: PasswordOptions) {
    currentOptions = next
    savePasswordOptions(next)
    optionListeners.forEach((listener) => listener())
  },
}

function usePasswordOptions() {
  return useSyncExternalStore(
    passwordOptionsStore.subscribe,
    passwordOptionsStore.getSnapshot,
    passwordOptionsStore.getServerSnapshot,
  )
}

function PasswordSection() {
  const lengthId = useId()
  const outputId = useId()
  const options = usePasswordOptions()
  // 入力途中の長さ（範囲外や空欄を含む）。null のときは保存済みの長さを表示する
  const [lengthDraft, setLengthDraft] = useState<string | null>(null)
  const [password, setPassword] = useState('')

  const updateOptions = passwordOptionsStore.set
  const lengthText = lengthDraft ?? String(options.length)

  const length = Number(lengthText)
  const isValidLength =
    lengthText.trim() !== '' &&
    Number.isInteger(length) &&
    length >= PASSWORD_LENGTH_MIN &&
    length <= PASSWORD_LENGTH_MAX
  const hasCharset = CHARSET_LABELS.some(({ key }) => options[key])

  function handleLengthChange(text: string) {
    setLengthDraft(text)
    const value = Number(text)
    if (
      text.trim() !== '' &&
      Number.isInteger(value) &&
      value >= PASSWORD_LENGTH_MIN &&
      value <= PASSWORD_LENGTH_MAX
    ) {
      updateOptions({ ...options, length: value })
    }
  }

  function handleGenerate() {
    const result = generatePassword({ ...options, length })
    if (result.ok) setPassword(result.password)
  }

  const messages = [
    isValidLength
      ? ''
      : `長さは ${PASSWORD_LENGTH_MIN}〜${PASSWORD_LENGTH_MAX} の範囲で指定してください。`,
    hasCharset ? '' : '文字種を1つ以上選んでください。',
  ].filter(Boolean)

  return (
    <section className="flex flex-col gap-3 lg:row-span-4 lg:grid lg:grid-rows-subgrid">
      <h2 className="text-lg font-semibold">パスワード</h2>
      {/* UUID と同じく、入力欄の横に生成ボタンを置く */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={lengthId} className="text-sm font-medium">
            長さ
          </label>
          <input
            id={lengthId}
            type="number"
            inputMode="numeric"
            min={PASSWORD_LENGTH_MIN}
            max={PASSWORD_LENGTH_MAX}
            value={lengthText}
            onChange={(e) => handleLengthChange(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={messages.length > 0}
          className={primaryButton}
        >
          パスワードを生成
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-medium">文字種</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {CHARSET_LABELS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={(e) =>
                    updateOptions({ ...options, [key]: e.target.checked })
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div aria-live="polite" className={errorText}>
          {messages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={outputId} className="text-sm font-medium">
            生成したパスワード
          </label>
          <CopyButton text={password} label="パスワードをコピー" />
        </div>
        <input
          id={outputId}
          type="text"
          value={password}
          readOnly
          spellCheck={false}
          className="w-full rounded-md border border-zinc-300 bg-zinc-50 p-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
    </section>
  )
}
