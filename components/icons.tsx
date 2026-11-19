// 追加・削除・保存などの操作で、どのツールでも同じ形を使うアイコン。
// コピーボタンと同じく 24×24 の線のアイコンにし、読み上げはボタンの名前に任せる（aria-hidden）

type IconProps = {
  /** テストや見た目の確認で、どのアイコンかを見分けるための名前 */
  name: string
  d: string
}

function Icon({ name, d }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon={name}
      className="size-4"
    >
      <path d={d} />
    </svg>
  )
}

export function PlusIcon() {
  return <Icon name="plus" d="M12 5v14 M5 12h14" />
}

// ふた・本体・縦の線2本のゴミ箱
export function TrashIcon() {
  return (
    <Icon
      name="trash"
      d="M4 7h16 M10 4h4 M6 7l1 13h10l1-13 M10 11v6 M14 11v6"
    />
  )
}

// フロッピーディスク（外形・ラベル・シャッター）
export function SaveIcon() {
  return <Icon name="save" d="M5 4h11l3 3v13H5z M8 4v5h7V4 M8 20v-6h8v6" />
}

export function CheckIcon() {
  return <Icon name="check" d="M5 12l5 5L20 7" />
}

export function CrossIcon() {
  return <Icon name="cross" d="M6 6l12 12 M18 6L6 18" />
}
