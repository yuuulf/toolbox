import type { ReactNode } from 'react'

type Variant = 'primary' | 'subtle'

type Props = {
  /** アクセシブルな名前とツールチップ（例:「追加」「#336699 を削除」） */
  label: string
  /** components/icons.tsx のアイコン */
  icon: ReactNode
  onClick?: () => void
  /** フォームの送信ボタンにするときは submit（Enter キーでも押せる） */
  type?: 'button' | 'submit'
  disabled?: boolean
  /** primary: 塗りつぶし（追加・保存）。subtle: 枠なしの薄い色（一覧の中の削除） */
  variant?: Variant
}

export const ICON_BUTTON_STYLES: Record<Variant, string> = {
  primary:
    'rounded-md bg-zinc-900 p-2 text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300',
  subtle:
    'rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
}

// 追加・削除・保存など、どのツールでも使う操作のアイコンのみのボタン。文字は出さず、
// 何をするかはアクセシブルな名前とツールチップ（同じ文言）で示す
export function IconButton({
  label,
  icon,
  onClick,
  type = 'button',
  disabled,
  variant = 'primary',
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`shrink-0 ${ICON_BUTTON_STYLES[variant]}`}
    >
      {icon}
    </button>
  )
}
