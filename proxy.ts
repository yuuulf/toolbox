import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getTool } from '@/components/tools/registry'

// どのルートにも一致しないパス。ここへ書き換えると app/not-found.tsx が 404 ステータスで返る
const NOT_FOUND_PATH = '/__not-found'

// Cache Components ではページ内の notFound() がシェル送信後に走り、ステータスが 200 のままになる。
// 本当の 404 を返すため、レンダリング前に未登録の slug をここで弾く
export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split('/')[2] ?? ''
  if (getTool(decodeURIComponent(slug))) return NextResponse.next()
  return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url))
}

export const config = {
  matcher: '/tools/:slug',
}
