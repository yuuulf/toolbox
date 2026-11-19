export type ViewMode = 'split' | 'editor' | 'preview'

export const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'split', label: '並べて表示' },
  { value: 'editor', label: '入力のみ' },
  { value: 'preview', label: 'プレビューのみ' },
]

type Props = {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

// 3つから1つを選ぶ切り替え。ほかのツールのボタンと同じく Tab で移動し、Enter / Space で選ぶ
export function ViewModeSwitch({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="表示"
      className="inline-flex rounded-md border border-zinc-300 dark:border-zinc-700"
    >
      {VIEW_MODES.map((mode) => {
        const selected = mode.value === value
        return (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(mode.value)}
            // 選択中は塗りつぶしで示す（色だけでなく、背景の有無で分かるようにする）
            className={
              selected
                ? 'bg-zinc-900 px-3 py-1 text-sm font-semibold text-white first:rounded-l-md last:rounded-r-md dark:bg-zinc-100 dark:text-zinc-900'
                : 'px-3 py-1 text-sm first:rounded-l-md last:rounded-r-md hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }
          >
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}
