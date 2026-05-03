import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { getQuestionToken, rememberQuestionToken } from './questionTokens.js'
import SiteFooter from './SiteFooter.jsx'

const BG = '#FAF6F0'
const ORANGE = '#C8773A'
const DARK = '#1f1f1f'
const NAV_BG = '#2B2724'
const NAV_FG = '#FAF6F0'

const WHATSAPP_URL = 'https://api.whatsapp.com/send?phone=7017230104'

function statusLabel(s) {
  if (s === 'treatment') return { text: 'Under Treatment', bg: '#FFF3E0', color: '#E65100' }
  if (s === 'urgent') return { text: 'Needs Urgent Support', bg: '#FFEBEE', color: '#C62828' }
  return { text: 'Looking for home', bg: '#E8F5E9', color: '#2E7D32' }
}

function petTypeLabel(t) {
  if (t === 'dog') return 'Dog'
  if (t === 'cat') return 'Cat'
  if (t === 'special') return 'Special needs'
  return t ? String(t) : '-'
}

function genderLabel(g) {
  if (g === null || g === undefined) return '-'
  const v = String(g).trim().toLowerCase()
  if (!v) return '-'
  if (['male', 'm', 'man', 'boy', 'м', 'муж', 'мужской', 'мальчик', 'самец', 'кобель', 'кот'].includes(v)) {
    return 'Male'
  }
  if (['female', 'f', 'woman', 'girl', 'ж', 'жен', 'женский', 'женская', 'девочка', 'самка', 'сука', 'кошка'].includes(v)) {
    return 'Female'
  }
  return String(g)
}

/** Arrival story + special traits (+ extra description when distinct), one readable block */
function combinedAnimalNarrative(animal) {
  const arr = (animal.arrival_story || '').trim()
  const desc = (animal.description || '').trim()
  const spec = (animal.special_characteristics || '').trim()
  const chunks = []
  if (arr) {
    chunks.push(arr)
    if (spec) chunks.push(spec)
    if (desc && desc !== arr) chunks.push(desc)
  } else if (desc) {
    chunks.push(desc)
    if (spec) chunks.push(spec)
  } else if (spec) {
    chunks.push(spec)
  }
  const text = chunks.join('\n\n').trim()
  return text || null
}

export default function AnimalPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [animal, setAnimal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState([])
  const [draft, setDraft] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const menuRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [{ data: a, error: aErr }, { data: q, error: qErr }] = await Promise.all([
        supabase.from('animals').select('*').eq('id', id).single(),
        supabase
          .from('questions')
          .select('id, animal_id, message, created_at, updated_at')
          .eq('animal_id', id)
          .order('created_at', { ascending: false }),
      ])
      if (cancelled) return
      if (aErr || !a) {
        setAnimal(null)
        setQuestions([])
        setLoading(false)
        return
      }
      setAnimal(a)
      if (qErr) setQuestions([])
      else setQuestions(q || [])
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function handlePost() {
    const text = draft.trim()
    if (!text) return
    const { data, error } = await supabase
      .from('questions')
      .insert({ animal_id: Number(id), message: text })
      .select('id, edit_token')
      .single()
    if (error) {
      alert('Could not save: ' + error.message)
      return
    }
    rememberQuestionToken(data.id, data.edit_token)
    const now = new Date().toISOString()
    setQuestions(prev => [
      {
        id: data.id,
        animal_id: Number(id),
        message: text,
        created_at: now,
        updated_at: now,
      },
      ...prev,
    ])
    setDraft('')
  }

  async function handleDelete(qid) {
    setOpenMenuId(null)
    const token = getQuestionToken(qid)
    if (!token) {
      alert('This message can only be deleted from the same browser session where it was posted.')
      return
    }
    if (!confirm('Delete this message?')) return
    const { error } = await supabase.rpc('delete_own_question', { q_id: qid, t: token })
    if (error) {
      alert('Could not delete. If this persists, ask your administrator to run the latest Supabase security script.')
      return
    }
    setQuestions(prev => prev.filter(q => q.id !== qid))
  }

  async function handleCopy(text) {
    setOpenMenuId(null)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* clipboard blocked */
    }
  }

  function startEdit(q) {
    setOpenMenuId(null)
    if (!getQuestionToken(q.id)) {
      alert('You can only edit messages posted in this browser session.')
      return
    }
    setEditingId(q.id)
    setEditingText(q.message)
  }

  async function saveEdit() {
    const text = editingText.trim()
    if (!text) return
    const token = getQuestionToken(editingId)
    if (!token) {
      alert('Missing permission token for this message.')
      return
    }
    const { error } = await supabase.rpc('update_own_question', {
      q_id: editingId,
      t: token,
      new_message: text,
    })
    if (error) {
      alert('Could not update.')
      return
    }
    setQuestions(prev =>
      prev.map(q => (q.id === editingId ? { ...q, message: text, updated_at: new Date().toISOString() } : q))
    )
    setEditingId(null)
    setEditingText('')
  }

  if (loading) {
    return (
      <div className="page-content-wide" style={{ padding: '3rem 0', background: BG, minHeight: '100vh', fontSize: '1.1rem' }}>
        Loading…
      </div>
    )
  }

  if (!animal) {
    return (
      <div className="page-content-wide" style={{ padding: '3rem 0', background: BG, minHeight: '100vh' }}>
        <p style={{ fontSize: '1.05rem' }}>Animal not found.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{ marginTop: '1rem', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
        >
          ← Home
        </button>
      </div>
    )
  }

  const s = statusLabel(animal.status)
  const storyBlock = combinedAnimalNarrative(animal)

  const navBtn = {
    padding: '11px 18px',
    border: '1px solid rgba(250,246,240,0.35)',
    background: 'rgba(250,246,240,0.1)',
    color: NAV_FG,
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 500,
  }

  const questionsSection = (
    <section className="animal-questions-panel" aria-labelledby="animal-questions-heading">
      <h2 id="animal-questions-heading" style={{ fontSize: '1.1rem', color: DARK, marginBottom: '0.5rem' }}>
        Do you have any questions about this animal?
      </h2>
      <p style={{ fontSize: '0.92rem', color: 'var(--color-muted)', marginBottom: '1rem', lineHeight: 1.55 }}>
        Leave a public note for the shelter team or other adopters. You can also message us on{' '}
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ color: ORANGE, fontWeight: 600 }}>
          WhatsApp
        </a>
        .
      </p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handlePost()
          }}
          placeholder="Type your question…"
          autoComplete="off"
          style={{
            flex: '1 1 200px',
            minWidth: '0',
            padding: '12px 14px',
            border: '1px solid #ddd',
            borderRadius: '10px',
            fontSize: '1rem',
            background: 'white',
          }}
        />
        <button
          type="button"
          onClick={handlePost}
          style={{
            padding: '12px 22px',
            background: ORANGE,
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
          Post
        </button>
      </div>

      <ul style={{ listStyle: 'none', marginTop: '1rem', padding: 0 }}>
        {questions.map(q => {
          const isEditing = editingId === q.id
          const canManage = Boolean(getQuestionToken(q.id))
          return (
            <li
              key={q.id}
              style={{
                position: 'relative',
                background: '#FAF0E6',
                borderRadius: '12px',
                padding: '12px 44px 12px 14px',
                marginBottom: '10px',
                border: '1px solid rgba(0,0,0,0.04)',
              }}
            >
              {isEditing ? (
                <>
                  <textarea
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '0.98rem',
                      background: 'white',
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={saveEdit}
                      style={{
                        padding: '6px 14px',
                        background: ORANGE,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null)
                        setEditingText('')
                      }}
                      style={{
                        padding: '6px 14px',
                        background: 'transparent',
                        color: DARK,
                        border: `1px solid ${DARK}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '0.98rem', color: DARK, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{q.message}</div>
                  <div style={{ fontSize: '0.78rem', color: '#999', marginTop: '6px' }}>
                    {new Date(q.created_at).toLocaleString()}
                    {q.updated_at && q.updated_at !== q.created_at ? ' · edited' : ''}
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => setOpenMenuId(openMenuId === q.id ? null : q.id)}
                aria-label="More actions"
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  color: '#666',
                  padding: '2px 8px',
                  lineHeight: 1,
                }}
              >
                ⋯
              </button>

              {openMenuId === q.id && (
                <div
                  ref={menuRef}
                  style={{
                    position: 'absolute',
                    top: '38px',
                    right: '8px',
                    background: 'white',
                    border: '1px solid #eee',
                    borderRadius: '10px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    zIndex: 5,
                  }}
                >
                  <MenuItem onClick={() => handleCopy(q.message)}>Copy</MenuItem>
                  {canManage && <MenuItem onClick={() => startEdit(q)}>Edit</MenuItem>}
                  {canManage && <MenuItem onClick={() => handleDelete(q.id)} danger>Delete</MenuItem>}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          rowGap: '12px',
          padding: '14px clamp(1rem, 4vw, 2.5rem)',
          background: NAV_BG,
          color: NAV_FG,
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25))',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '40px 1px',
          backgroundPosition: 'bottom center',
        }}
      >
        <div
          style={{ fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', color: NAV_FG, fontFamily: 'var(--font-display)' }}
          onClick={() => navigate('/')}
        >
          🐾 PlayFul Paws
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => navigate('/')} style={navBtn}>
            Home
          </button>
          <button type="button" onClick={() => navigate(-1)} style={navBtn}>
            ← Back
          </button>
        </div>
      </header>

      <main className="page-content-wide" style={{ paddingTop: 'var(--space-section-y)', paddingBottom: 'var(--space-section-y)', maxWidth: 'min(1200px, calc(100vw - 2rem))' }}>
        <div className="animal-profile-layout">
          <div className="animal-profile-top">
            <div className="animal-side-column">
              <aside className="animal-requirements-panel" aria-labelledby="adoption-req-heading">
                <h2 id="adoption-req-heading" style={{ fontSize: '1.15rem', color: DARK, marginBottom: '0.75rem' }}>
                  Adoption Requirements
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-muted)', marginBottom: '1rem', lineHeight: 1.55 }}>
                  Please read carefully before you apply - this keeps adoptions safe and transparent for you and for the
                  shelter.
                </p>
                <ul style={{ paddingLeft: '1.25rem', color: '#3a3a3a', lineHeight: 1.75, fontSize: '1rem' }}>
                  <li>Review all information about the animal carefully.</li>
                  <li>Provide honest details about your living environment and schedule.</li>
                  <li>Be prepared for a conversation with the shelter team before adoption is confirmed.</li>
                </ul>
              </aside>
              {questionsSection}
            </div>

            <div className="animal-main-column">
              <article className="animal-card">
            {animal.photo_url ? (
              <img
                src={animal.photo_url}
                alt={animal.name}
                style={{ width: '100%', height: 'clamp(220px, 38vw, 360px)', objectFit: 'contain', background: '#E8DCC8' }}
              />
            ) : (
              <div
                style={{
                  height: '280px',
                  background: '#E8DCC8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem',
                }}
              >
                {animal.type === 'cat' ? '🐈' : '🐕'}
              </div>
            )}

            <div style={{ padding: '1.5rem clamp(1.1rem, 3vw, 1.85rem) 1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.85rem)', color: DARK }}>{animal.name}</h1>
                <span
                  style={{
                    padding: '5px 14px',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: s.bg,
                    color: s.color,
                  }}
                >
                  {s.text}
                </span>
              </div>

              <div className="animal-detail-grid">
                <div className="animal-meta-stack">
                  <div className="animal-meta-row">
                    <span className="animal-meta-label">Type</span>
                    <span className="animal-meta-value">{petTypeLabel(animal.type)}</span>
                  </div>
                  <div className="animal-meta-row">
                    <span className="animal-meta-label">Age</span>
                    <span className="animal-meta-value">{animal.age || '-'}</span>
                  </div>
                  <div className="animal-meta-row">
                    <span className="animal-meta-label">Gender</span>
                    <span className="animal-meta-value">{genderLabel(animal.gender)}</span>
                  </div>
                </div>
                <div>
                  <h2 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>
                    Story & characteristics
                  </h2>
                  {storyBlock ? (
                    <p className="animal-story-prose">{storyBlock}</p>
                  ) : (
                    <p className="animal-story-prose" style={{ color: 'var(--color-muted)' }}>
                      No background text has been added for this animal yet. Contact the shelter for details.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </article>
              <button
                type="button"
                className="animal-cta-after-card"
                onClick={() => navigate(`/apply/${animal.id}`)}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: ORANGE,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Go to Adoption Application →
              </button>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function MenuItem({ onClick, children, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '10px 18px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '0.95rem',
        color: danger ? '#C62828' : DARK,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#FAF0E6')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  )
}
