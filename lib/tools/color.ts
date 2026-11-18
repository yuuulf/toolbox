export type Rgb = { r: number; g: number; b: number }

export type Hsl = { h: number; s: number; l: number }

export type ColorResult =
  { ok: true; rgb: Rgb } | { ok: false; kind: 'empty' | 'invalid' }

const RGB_MAX = 255
const HUE_MAX = 360
const PERCENT_MAX = 100

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/
const FUNCTION_PATTERN = /^(rgb|hsl)\((.*)\)$/
const INTEGER_PATTERN = /^\d+$/
const NUMBER_PATTERN = /^\d+(\.\d+)?$/
const PERCENT_PATTERN = /^(\d+(\.\d+)?)%$/

const INVALID: ColorResult = { ok: false, kind: 'invalid' }

export function parseColor(input: string): ColorResult {
  const text = input.trim().toLowerCase()
  if (text === '') return { ok: false, kind: 'empty' }

  const hex = HEX_PATTERN.exec(text)
  if (hex) return { ok: true, rgb: parseHexDigits(hex[1]) }

  const fn = FUNCTION_PATTERN.exec(text)
  if (!fn) return INVALID
  const args = splitArgs(fn[2])
  if (!args) return INVALID
  const rgb = fn[1] === 'rgb' ? parseRgbArgs(args) : parseHslArgs(args)
  return rgb ? { ok: true, rgb } : INVALID
}

function parseHexDigits(digits: string): Rgb {
  // #rgb は各桁を2回繰り返した #rrggbb と同じ色
  const full =
    digits.length === 3 ? [...digits].map((d) => d + d).join('') : digits
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

/** カンマ区切りかスペース区切りの3つの値に分ける。混在や個数違いは null */
function splitArgs(inner: string): string[] | null {
  const body = inner.trim()
  const parts = body.includes(',')
    ? body.split(',').map((part) => part.trim())
    : body.split(/\s+/)
  if (parts.length !== 3) return null
  if (parts.some((part) => part === '' || /\s/.test(part))) return null
  return parts
}

function parseRgbArgs(args: string[]): Rgb | null {
  const values: number[] = []
  for (const arg of args) {
    if (!INTEGER_PATTERN.test(arg)) return null
    const value = Number(arg)
    if (value > RGB_MAX) return null
    values.push(value)
  }
  return { r: values[0], g: values[1], b: values[2] }
}

function parseHslArgs([hText, sText, lText]: string[]): Rgb | null {
  if (!NUMBER_PATTERN.test(hText)) return null
  const h = Number(hText)
  const s = parsePercent(sText)
  const l = parsePercent(lText)
  if (h > HUE_MAX || s === null || l === null) return null
  return hslToRgb({ h, s, l })
}

function parsePercent(text: string): number | null {
  const match = PERCENT_PATTERN.exec(text)
  if (!match) return null
  const value = Number(match[1])
  return value > PERCENT_MAX ? null : value
}

/** h: 0〜360、s・l: 0〜100 */
export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sat = s / PERCENT_MAX
  const light = l / PERCENT_MAX
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(light, 1 - light)
  const channel = (n: number) =>
    Math.round(
      (light - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))) * RGB_MAX,
    )
  return { r: channel(0), g: channel(8), b: channel(4) }
}

/** 戻り値は丸める前の値（h: 0〜360 未満、s・l: 0〜100） */
export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const [rn, gn, bn] = [r, g, b].map((v) => v / RGB_MAX)
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l: l * PERCENT_MAX }

  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === rn) h = ((gn - bn) / d) % 6
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  h = (h * 60 + HUE_MAX) % HUE_MAX
  return { h, s: s * PERCENT_MAX, l: l * PERCENT_MAX }
}

export function formatHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function formatRgb({ r, g, b }: Rgb): string {
  return `rgb(${r}, ${g}, ${b})`
}

export function formatHsl(rgb: Rgb): string {
  const { h, s, l } = rgbToHsl(rgb)
  // 丸めで 360 になったら 0 と同じ色相として表示する
  const hue = Math.round(h) % HUE_MAX
  return `hsl(${hue}, ${Math.round(s)}%, ${Math.round(l)}%)`
}
