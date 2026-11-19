import { useCallback, useEffect, useRef, useState } from 'react'

// 打鍵のたびに全文を書き込まないよう、入力が止まってから保存する
export const AUTOSAVE_DELAY_MS = 500

/**
 * 値を、変わってから AUTOSAVE_DELAY_MS 後に自動で保存する。
 * ページを離れるとき（pagehide・非表示・アンマウント）は待たずに保存する。
 * 戻り値は、最後の保存に失敗したかどうか
 */
export function useAutoSave(
  value: string,
  ready: boolean,
  save: (value: string) => boolean,
): boolean {
  const [failed, setFailed] = useState(false)
  // 最後に保存した値。最初は読み込んだ値なので、開いただけでは書き込まない
  const savedRef = useRef(value)
  const pendingRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const saveRef = useRef(save)

  useEffect(() => {
    saveRef.current = save
  }, [save])

  const flush = useCallback(() => {
    clearTimeout(timerRef.current)
    const pending = pendingRef.current
    if (pending === null) return
    pendingRef.current = null
    const ok = saveRef.current(pending)
    if (ok) savedRef.current = pending
    setFailed(!ok)
  }, [])

  useEffect(() => {
    // 読み込む前の空の値で、保存した内容を消さない
    if (!ready) return
    if (value === savedRef.current) {
      pendingRef.current = null
      return
    }
    pendingRef.current = value
    timerRef.current = setTimeout(flush, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timerRef.current)
  }, [value, ready, flush])

  useEffect(() => {
    // スマートフォンではアプリを切り替えた後に pagehide なしで破棄されることがあるため、非表示でも保存する。
    // サイドバーからほかのツールへ移るときは pagehide が起きないので、アンマウントでも保存する
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      flush()
    }
  }, [flush])

  return failed
}
