import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link href="/" className="mt-6 inline-block underline">
        ツール一覧へ戻る
      </Link>
    </main>
  )
}
