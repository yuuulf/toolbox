type Props = {
  done: number
  total: number
}

export function CompletionCount({ done, total }: Props) {
  return (
    <span className="text-sm text-zinc-600 dark:text-zinc-400">
      {/* 「1/3」は「1スラッシュ3」と読まれるため、読み上げ用の文言を別に置く */}
      <span aria-hidden="true">
        {done}/{total}
      </span>
      <span className="sr-only">
        {total}件中{done}件完了
      </span>
    </span>
  )
}
