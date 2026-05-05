import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import SiteFooter from './SiteFooter.jsx'

const BG = '#FAF6F0'
const ORANGE = '#C8773A'
const DARK = '#1f1f1f'
const NAV_BG = '#1A5C52'
const NAV_FG = '#FAF6F0'

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

const navBtn = {
  padding: '11px 20px',
  border: '1px solid rgba(250,246,240,0.35)',
  background: 'rgba(250,246,240,0.1)',
  color: NAV_FG,
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '15px',
  fontWeight: 500,
  whiteSpace: 'nowrap',
}

export default function AnimalsCatalogPage() {
  const navigate = useNavigate()
  const [animals, setAnimals] = useState([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('animals')
        .select('*')
        .order('created_at', { ascending: false })
      if (cancelled) return
      setAnimals(data || [])
      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = animals.filter(a => (typeFilter === 'all' ? true : a.type === typeFilter))

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
        }}
      >
        <div
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            cursor: 'pointer',
            color: NAV_FG,
            fontFamily: 'var(--font-display)',
          }}
          onClick={() => navigate('/')}
        >
          PlayFul Paws
        </div>
        <nav style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => navigate('/')} style={navBtn}>
            ← Home
          </button>
        </nav>
      </header>

      <main
        className="page-content-wide"
        style={{
          paddingTop: 'var(--space-section-y)',
          paddingBottom: 'var(--space-section-y)',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            fontSize: 'clamp(1.85rem, 4vw, 2.4rem)',
            color: DARK,
            marginBottom: '0.6rem',
          }}
        >
          Find your new best friend
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-muted)',
            fontSize: '1.05rem',
            lineHeight: 1.55,
            maxWidth: '620px',
            margin: '0 auto 2.25rem',
          }}
        >
          Every pet here is rescued, treated and waiting for a forever family at the “Comes” shelter in Kainar.
          Tap any animal to read their story, learn their care needs and start an adoption.
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '2rem',
          }}
        >
          {[
            ['all', 'Everything'],
            ['dog', 'Dogs'],
            ['cat', 'Cats'],
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setTypeFilter(val)}
              style={{
                padding: '10px 28px',
                border: `2px solid ${ORANGE}`,
                background: typeFilter === val ? ORANGE : 'transparent',
                color: typeFilter === val ? 'white' : ORANGE,
                borderRadius: '999px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-muted)',
            fontSize: '0.9rem',
            marginBottom: '1.4rem',
          }}
        >
          {loaded ? `Showing ${filtered.length} ${filtered.length === 1 ? 'animal' : 'animals'}` : 'Loading…'}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1.4rem',
          }}
        >
          {filtered.map(animal => {
            const s = statusLabel(animal.status)
            return (
              <div
                key={animal.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/animal/${animal.id}`)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/animal/${animal.id}`)
                  }
                }}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.10)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
                }}
              >
                {animal.photo_url ? (
                  <img
                    src={animal.photo_url}
                    alt={`Comes Animal Shelter - ${animal.name}, ${
                      animal.type === 'cat' ? 'cat' : 'dog'
                    } available for adoption · приют для животных Comes`}
                    style={{ width: '100%', height: '210px', objectFit: 'contain', background: '#E8DCC8' }}
                  />
                ) : (
                  <div
                    style={{
                      height: '210px',
                      background: '#E8DCC8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3.2rem',
                    }}
                  >
                    {animal.type === 'cat' ? '🐈' : '🐕'}
                  </div>
                )}
                <div
                  style={{
                    padding: '16px 18px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <h2 style={{ fontSize: '1.18rem', color: DARK, fontWeight: 700, margin: 0 }}>{animal.name}</h2>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                      {petTypeLabel(animal.type)}
                      {animal.age ? ` · ${animal.age}` : ''}
                    </span>
                  </div>
                  <span
                    style={{
                      alignSelf: 'flex-start',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      background: s.bg,
                      color: s.color,
                    }}
                  >
                    {s.text}
                  </span>
                  <span
                    style={{
                      marginTop: 'auto',
                      color: ORANGE,
                      fontWeight: 600,
                      fontSize: '0.92rem',
                    }}
                  >
                    View profile →
                  </span>
                </div>
              </div>
            )
          })}
          {loaded && filtered.length === 0 && (
            <p
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                color: 'var(--color-muted)',
                fontSize: '1rem',
              }}
            >
              No animals to show in this category yet.
            </p>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
