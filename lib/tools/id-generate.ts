import { readJson, writeJson } from '@/lib/storage'

// 乱数はすべて Web Crypto API（暗号論的に安全な乱数）から取る。Math.random は使わない

// ---- UUID ----

export const UUID_COUNT_MIN = 1
export const UUID_COUNT_MAX = 100

export type UuidResult =
  { ok: true; uuids: string[] } | { ok: false; error: 'out-of-range' }

export function generateUuids(count: number): UuidResult {
  if (
    !Number.isInteger(count) ||
    count < UUID_COUNT_MIN ||
    count > UUID_COUNT_MAX
  ) {
    return { ok: false, error: 'out-of-range' }
  }
  return { ok: true, uuids: Array.from({ length: count }, randomUuid) }
}

export function randomUuid(): string {
  // randomUUID は安全なコンテキスト（HTTPS / localhost）でしか使えないため、ない場合は自前で組み立てる
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // バージョン 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // バリアント（RFC 9562）
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

// ---- パスワード ----

export const PASSWORD_LENGTH_MIN = 4
export const PASSWORD_LENGTH_MAX = 128

export const CHARSETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  // 引用符・バックスラッシュ・空白は、シェルや区切り文字で扱いにくいため含めない
  symbols: '!@#$%^&*()-_=+[]{};:,.?/',
} as const

export type CharsetKey = keyof typeof CHARSETS

export type PasswordOptions = { length: number } & Record<CharsetKey, boolean>

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 16,
  upper: true,
  lower: true,
  digits: true,
  symbols: true,
}

export type PasswordResult =
  | { ok: true; password: string }
  | { ok: false; error: 'invalid-length' | 'no-charset' }

export function generatePassword(options: PasswordOptions): PasswordResult {
  if (!isValidLength(options.length)) {
    return { ok: false, error: 'invalid-length' }
  }
  const selected = (Object.keys(CHARSETS) as CharsetKey[])
    .filter((key) => options[key])
    .map((key) => CHARSETS[key])
  if (selected.length === 0) return { ok: false, error: 'no-charset' }
  // 文字種の数が長さを超えると全種を含められない。最小長 4 と文字種 4 つなので起きないが念のため
  if (selected.length > options.length) {
    return { ok: false, error: 'invalid-length' }
  }

  // 選んだ各文字種から1文字ずつ確保し、残りは全文字種の和集合から選んでからシャッフルする
  const all = selected.join('')
  const chars = selected.map(pick)
  while (chars.length < options.length) chars.push(pick(all))
  shuffle(chars)
  return { ok: true, password: chars.join('') }
}

function isValidLength(length: number): boolean {
  return (
    Number.isInteger(length) &&
    length >= PASSWORD_LENGTH_MIN &&
    length <= PASSWORD_LENGTH_MAX
  )
}

function pick(charset: string): string {
  return charset[randomInt(charset.length)]
}

// Fisher–Yates。交換位置も安全な乱数で決める
function shuffle<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[items[i], items[j]] = [items[j], items[i]]
  }
}

const UINT32_RANGE = 2 ** 32

// 0 以上 max 未満の一様な整数。剰余だけだと小さい値に偏るため、max の倍数に収まらない値は捨てて引き直す
function randomInt(max: number): number {
  const limit = UINT32_RANGE - (UINT32_RANGE % max)
  const buffer = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(buffer)
    if (buffer[0] < limit) return buffer[0] % max
  }
}

// ---- 設定の保存（localStorage） ----

export const PASSWORD_OPTIONS_KEY = 'toolbox:id-generator:password-options'

export function isPasswordOptions(value: unknown): value is PasswordOptions {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.length === 'number' &&
    isValidLength(v.length) &&
    (Object.keys(CHARSETS) as CharsetKey[]).every(
      (key) => typeof v[key] === 'boolean',
    )
  )
}

export function loadPasswordOptions(): PasswordOptions {
  return readJson(
    PASSWORD_OPTIONS_KEY,
    isPasswordOptions,
    DEFAULT_PASSWORD_OPTIONS,
  )
}

export function savePasswordOptions(options: PasswordOptions): void {
  writeJson(PASSWORD_OPTIONS_KEY, options)
}
