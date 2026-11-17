// localStorage はプライベートモードやストレージ無効化、SSR 中などで例外を投げたり存在しなかったりする。
// どの失敗でもアプリを壊さないよう、すべての読み書きをここに集約して例外を握りつぶす。

export function readJson<T>(
  key: string,
  validate: (value: unknown) => value is T,
  fallback: T,
): T {
  try {
    const raw = globalThis.localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed: unknown = JSON.parse(raw)
    return validate(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    globalThis.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
