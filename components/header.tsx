import Image from 'next/image'
import Link from 'next/link'
import faviconDark from '@/public/favicon-dark.png'
import faviconLight from '@/public/favicon-light.png'

// 画像を import すると、ビルド時に basePath（/toolbox）付きの URL になる。
// static export では既定のローダーで最適化できないため unoptimized にする
const ICON_SIZE = 24

export function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto w-full max-w-5xl px-4 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg font-bold"
        >
          {/* 飾りなので alt を空にし、リンク名は「toolbox」の文字から決まるようにする。
              画面のほかの部分と同じく dark: で OS のライト/ダーク設定に追従させる */}
          <Image
            src={faviconLight}
            alt=""
            width={ICON_SIZE}
            height={ICON_SIZE}
            unoptimized
            className="dark:hidden"
          />
          <Image
            src={faviconDark}
            alt=""
            width={ICON_SIZE}
            height={ICON_SIZE}
            unoptimized
            className="hidden dark:block"
          />
          toolbox
        </Link>
      </div>
    </header>
  )
}
