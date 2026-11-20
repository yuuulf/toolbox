type Props = {
  /** 表示する値。改行・タブ・連続する空白はそのまま表示する */
  value: string
  /** 欄の名前にする見出しの id（aria-labelledby で参照する） */
  labelId: string
  /** 高さなど、欄ごとに違う指定 */
  className?: string
}

// 値を変えられない結果の表示欄。テキスト欄（readOnly）だと文字カーソルやサイズ変更のつまみが出て
// 編集できそうに見えるため、Markdownプレビューと同じく、フォーカスしてスクロールできる表示領域にする。
// tabIndex は、長い結果をキーボードでもスクロールできるようにするため。
// min-h は空でも1行分の枠を残すため（flex の中では min-h-0 で上書きしないこと。縮むのはこの高さまで）。
// contain-inline-size は、折り返さない長い行（128 文字のパスワードなど）で、外側の列の幅が押し広げられないようにするため
export function OutputView({ value, labelId, className = '' }: Props) {
  return (
    <div
      role="region"
      aria-labelledby={labelId}
      tabIndex={0}
      className={`min-h-9.5 w-full contain-inline-size overflow-auto rounded-md border border-zinc-300 bg-zinc-50 p-2 font-mono text-sm whitespace-pre dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
    >
      {value}
    </div>
  )
}
