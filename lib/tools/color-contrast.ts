import type { Rgb } from './color'

export type WcagLevel = 'AA' | 'AAA'
export type TextSize = 'normal' | 'large'

export type WcagCriterion = {
  level: WcagLevel
  size: TextSize
  /** この値以上のコントラスト比で合格 */
  threshold: number
}

export type WcagResult = WcagCriterion & { pass: boolean }

// WCAG 2.x 達成基準 1.4.3（AA）と 1.4.6（AAA）
export const WCAG_CRITERIA: readonly WcagCriterion[] = [
  { level: 'AA', size: 'normal', threshold: 4.5 },
  { level: 'AA', size: 'large', threshold: 3 },
  { level: 'AAA', size: 'normal', threshold: 7 },
  { level: 'AAA', size: 'large', threshold: 4.5 },
]

const RGB_MAX = 255
const LUMINANCE_OFFSET = 0.05
const RATIO_DECIMALS = 2

/** WCAG 2.x の相対輝度（0〜1） */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const [rl, gl, bl] = [r, g, b].map((v) => {
    const c = v / RGB_MAX
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

/** 1〜21。2色の順序は問わない */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  )
  return (light + LUMINANCE_OFFSET) / (dark + LUMINANCE_OFFSET)
}

/** `4.47:1` の形式。基準をわずかに下回る比が合格に見えないよう、四捨五入せず切り捨てる */
export function formatContrastRatio(ratio: number): string {
  const scale = 10 ** RATIO_DECIMALS
  return `${(Math.floor(ratio * scale) / scale).toFixed(RATIO_DECIMALS)}:1`
}

/** 合否は丸める前の比で判定する */
export function evaluateWcag(ratio: number): WcagResult[] {
  return WCAG_CRITERIA.map((criterion) => ({
    ...criterion,
    pass: ratio >= criterion.threshold,
  }))
}
