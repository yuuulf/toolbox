// 追加・削除などの操作で、どのツールでも同じ形を使うアイコン。
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

// 下向きの矢印と受け皿のダウンロード
export function DownloadIcon() {
  return <Icon name="download" d="M12 4v11 M7 10l5 5 5-5 M5 20h14" />
}
