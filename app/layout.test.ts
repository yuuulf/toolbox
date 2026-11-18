import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BASE_PATH } from '@/lib/base-path'
import { metadata } from './layout'

type IconDescriptor = { url: string; media?: string }

const icons = (metadata.icons as { icon: IconDescriptor[] }).icon

describe('ファビコン', () => {
  it('OS の設定に合わせて、ライト用とダーク用のアイコンを使い分ける', () => {
    expect(icons.map((icon) => icon.media)).toEqual([
      '(prefers-color-scheme: light)',
      '(prefers-color-scheme: dark)',
    ])
  })

  it('アイコンの URL はベースパスの下にあり、指す画像が public/ に存在する', () => {
    for (const { url } of icons) {
      expect(url.startsWith(`${BASE_PATH}/`)).toBe(true)
      const file = url.slice(BASE_PATH.length)
      expect(existsSync(join(process.cwd(), 'public', file))).toBe(true)
    }
  })
})
