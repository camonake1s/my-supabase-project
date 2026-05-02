const STORAGE_KEY = 'playful_paws_question_tokens'

function readMap() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function writeMap(map) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* private mode / quota */
  }
}

/** Remember the edit token returned by Supabase for a new question (session-only). */
export function rememberQuestionToken(questionId, token) {
  if (!questionId || !token) return
  const map = readMap()
  map[String(questionId)] = token
  writeMap(map)
}

export function getQuestionToken(questionId) {
  const map = readMap()
  return map[String(questionId)] ?? null
}
