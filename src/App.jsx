import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import DonateQr from './DonateQr.jsx'
import SiteFooter from './SiteFooter.jsx'

const BG = '#FAF6F0'
const ORANGE = '#C8773A'
const ACCENT = '#FF9F1C'
const DARK = '#1f1f1f'
const NAV_BG = '#1A5C52'
const NAV_FG = '#FAF6F0'

const INSTAGRAM_URL = 'https://www.instagram.com/comes.kz.almaty/'
const WHATSAPP_URL = 'https://api.whatsapp.com/send?phone=7017230104'
const DONATE_URL = 'https://scan.page/zJh9WM'
const INVISIONU_URL = 'https://www.invisionu.education/'

/** Original design assets — add these files under public/about/ */
const ABOUT_TEAM_PHOTO = '/about/team-photo.jpg'
const ABOUT_PROJECT_PHOTO = '/about/project-mockup.jpg'

const HERO_IMAGE_URL = 'https://i.pinimg.com/736x/16/bd/d9/16bdd92a5093b8166b4b31f322536220.jpg'

const OTHER_DONATION_METHODS = [
  {
    id: 'phone',
    label: 'By phone (Kaspi / Halyk transfer)',
    display: '+7 701 723 01 04',
    copyText: '+77017230104',
    mono: true,
  },
  {
    id: 'freedom',
    label: 'Freedom Bank (KZ)',
    display: '5269 8800 6024 3250',
    copyText: '5269880060243250',
    mono: true,
  },
  {
    id: 'forte',
    label: 'Forte Bank (KZ)',
    display: '5366 8520 0180 2744',
    copyText: '5366852001802744',
    mono: true,
  },
  {
    id: 'vtb',
    label: 'VTB (Russia)',
    display: '2204 3602 0011 0896',
    copyText: '2204360200110896',
    mono: true,
  },
  {
    id: 'paypal',
    label: 'PayPal (international)',
    display: 'paypal.me/YuliaSnegireva',
    copyText: 'https://www.paypal.me/YuliaSnegireva',
    href: 'https://www.paypal.me/YuliaSnegireva',
  },
]

const NEWS_POSTS = [
  {
    source: 'informburo.kz',
    sourceColor: '#1A5C52',
    url: 'https://informburo.kz/stati/priiut-nadezdy-kak-bliz-almaty-spasaiut-tex-kogo-odnazdy-predali-liudi',
    title: 'How a shelter near Almaty rescues abandoned animals',
    summary:
      '350+ dogs and 40 cats. Founded by Yulia & Sergey Snegirev. Every animal gets treatment, rehabilitation, and a safe path to a new family.',
  },
  {
    source: 'Instagram',
    sourceColor: '#C8773A',
    url: 'https://www.instagram.com/reel/DVTYCxOjRc4/',
    title: 'A sleepy guard dog',
    summary: 'A sweet video of our “watchdog” who fell fast asleep on the job.',
  },
  {
    source: 'Instagram',
    sourceColor: '#C8773A',
    url: 'https://www.instagram.com/reel/DVafFLzjeTF/',
    title: 'A day in the life - cute moments',
    summary: 'Behind the scenes of a typical, heartwarming day at the shelter.',
  },
  {
    source: 'Instagram',
    sourceColor: '#C8773A',
    url: 'https://www.instagram.com/reel/DVgIThvjQ3H/',
    title: 'First steps at the shelter',
    summary:
      'A brave pup returning from the clinic and getting to know their new home and friends.',
  },
  {
    source: 'Instagram',
    sourceColor: '#C8773A',
    url: 'https://www.instagram.com/reel/DVlxQ28DdqJ/',
    title: 'Preparing the cattery',
    summary: 'How we care for our cats and set up their cozy living spaces.',
  },
  {
    source: 'Instagram',
    sourceColor: '#C8773A',
    url: 'https://www.instagram.com/reel/DVsYd64je40/',
    title: 'Cat mealtime magic',
    summary: 'A precious look at our cats enjoying their favorite meals.',
  },
  {
    source: 'Instagram',
    sourceColor: '#C8773A',
    url: 'https://www.instagram.com/reel/DVux-yJEVI-/',
    title: 'Nap time for the kitties',
    summary: 'Peaceful moments of our rescued cats relaxing and recharging.',
  },
  {
    source: 'Instagram',
    sourceColor: '#C8773A',
    url: 'https://www.instagram.com/reel/DV3ZJ9IDZtL/',
    title: 'Shelter renovations in progress',
    summary: 'Building a better future - a look at the construction works at the shelter.',
  },
  {
    source: 'Instagram',
    sourceColor: '#C8773A',
    url: 'https://www.instagram.com/reel/DWk6CNNxiCb/',
    title: 'Dinner is served!',
    summary: 'Our feline residents gathered together for their evening feast.',
  },
]

function InstagramIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.05 4.91A9.86 9.86 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01ZM12.04 20.13h-.01a8.21 8.21 0 0 1-4.18-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.23-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.69 8.21-8.23 8.21Zm4.51-6.16c-.25-.13-1.46-.72-1.69-.8-.23-.08-.39-.13-.56.13-.17.25-.64.8-.79.97-.14.17-.29.19-.54.06a6.78 6.78 0 0 1-1.99-1.23 7.5 7.5 0 0 1-1.38-1.72c-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.14.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42l-.48-.01c-.17 0-.45.06-.68.32-.23.25-.89.87-.89 2.13 0 1.26.92 2.47 1.05 2.64.13.17 1.81 2.77 4.39 3.88.61.26 1.09.42 1.46.54.61.19 1.17.16 1.61.1.49-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.14-1.18-.06-.11-.23-.17-.48-.3Z" />
    </svg>
  )
}

function iconLinkStyle(color) {
  return {
    width: '56px',
    height: '56px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${color}`,
    borderRadius: '14px',
    background: 'white',
    color,
    cursor: 'pointer',
    textDecoration: 'none',
  }
}

function statusLabel(s) {
  if (s === 'treatment') return { text: 'Under Treatment', bg: '#FFF3E0', color: '#E65100' }
  if (s === 'urgent') return { text: 'Needs Urgent Support', bg: '#FFEBEE', color: '#C62828' }
  return { text: 'Looking for home', bg: '#E8F5E9', color: '#2E7D32' }
}

function OtherWaysToDonate() {
  const [copiedId, setCopiedId] = useState(null)

  async function handleCopy(id, text) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(prev => (prev === id ? null : prev)), 1800)
    } catch (err) {
      console.error('Clipboard write failed:', err)
    }
  }

  return (
    <div className="other-donate-block">
      <h3>Other ways to donate</h3>
      <ul className="other-donate-list">
        {OTHER_DONATION_METHODS.map(m => (
          <li key={m.id} className="other-donate-row">
            <div className="other-donate-meta">
              <span className="other-donate-label">{m.label}</span>
              {m.href ? (
                <a
                  className="other-donate-value"
                  href={m.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {m.display}
                </a>
              ) : (
                <span className={`other-donate-value${m.mono ? ' mono' : ''}`}>
                  {m.display}
                </span>
              )}
            </div>
            <button
              type="button"
              className="other-donate-copy"
              onClick={() => handleCopy(m.id, m.copyText)}
              aria-label={`Copy ${m.label}`}
            >
              {copiedId === m.id ? 'Copied' : 'Copy'}
            </button>
          </li>
        ))}
      </ul>
      <p className="other-donate-holder">
        Cardholder name: <strong>Snegiryova Yuliya</strong> (founder of Comes shelter)
      </p>
    </div>
  )
}

function NewsCarousel() {
  const scrollerRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const update = () => {
      setCanLeft(el.scrollLeft > 4)
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  function scrollByStep(direction) {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector('.news-card')
    const step = card ? card.offsetWidth + 16 : 296
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  return (
    <div className="news-carousel">
      <button
        type="button"
        className="news-arrow news-arrow-left"
        onClick={() => scrollByStep(-1)}
        aria-label="Show previous news cards"
        disabled={!canLeft}
      >
        ‹
      </button>

      <div className="news-scroller" ref={scrollerRef}>
        {NEWS_POSTS.map(post => {
          const cta = post.source === 'Instagram' ? 'Watch the full video →' : 'Read full story →'
          return (
            <a
              key={post.url}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="news-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: 'white',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '14px',
                overflow: 'hidden',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    background: post.sourceColor,
                    color: 'white',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    padding: '3px 9px',
                    borderRadius: '999px',
                  }}
                >
                  {post.source}
                </span>
              </div>
              <div style={{ padding: '6px 18px 14px', flex: 1 }}>
                <h3 style={{ fontSize: '1.05rem', color: DARK, lineHeight: 1.35, marginBottom: '0.45rem' }}>
                  {post.title}
                </h3>
                <p style={{ fontSize: '0.93rem', color: 'var(--color-muted)', lineHeight: 1.55, margin: 0 }}>
                  {post.summary}
                </p>
              </div>
              <div
                style={{
                  padding: '12px 18px',
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                  fontSize: '0.88rem',
                  color: ORANGE,
                  fontWeight: 600,
                }}
              >
                {cta}
              </div>
            </a>
          )
        })}
      </div>

      <button
        type="button"
        className="news-arrow news-arrow-right"
        onClick={() => scrollByStep(1)}
        aria-label="Show next news cards"
        disabled={!canRight}
      >
        ›
      </button>
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const petsRef = useRef(null)
  const donateRef = useRef(null)
  const aboutRef = useRef(null)
  const newsRef = useRef(null)

  const [animals, setAnimals] = useState([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [listLoaded, setListLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: animalsData } = await supabase
        .from('animals')
        .select('*')
        .order('created_at', { ascending: false })
      if (cancelled) return
      setAnimals(animalsData || [])
      setListLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = animals.filter(a => (typeFilter === 'all' ? true : a.type === typeFilter))

  const scrollTo = ref =>
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })

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
          style={{ fontSize: '1.15rem', fontWeight: 700, cursor: 'pointer', color: NAV_FG, fontFamily: 'var(--font-display)' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          PlayFul Paws
        </div>
        <nav style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => navigate('/animals')} style={navBtn}>
            Find an Animal
          </button>
          <button type="button" onClick={() => navigate('/story')} style={navBtn}>
            About the Shelter
          </button>
          <button type="button" onClick={() => scrollTo(aboutRef)} style={navBtn}>
            Who are PlayFul Paws?
          </button>
        </nav>
      </header>

      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          background: BG,
          minHeight: 'clamp(420px, 56vw, 580px)',
        }}
      >
        <div
          style={{
            flex: '1 1 360px',
            minWidth: '300px',
            padding: 'clamp(2.25rem, 5vw, 3.75rem) clamp(1.5rem, 4vw, 3rem)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: DARK,
          }}
        >
          <div style={{ maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto', width: '100%' }}>
            <h1
              style={{
                fontSize: 'clamp(2.1rem, 5vw, 3rem)',
                fontWeight: 700,
                color: DARK,
                lineHeight: 1.15,
                marginBottom: '1rem',
              }}
            >
              Your new{' '}
              <span
                style={{
                  background:
                    'linear-gradient(180deg, transparent 0%, transparent 18%, #CFE3C9 18%, #CFE3C9 92%, transparent 92%)',
                  padding: '0 4px',
                  WebkitBoxDecorationBreak: 'clone',
                  boxDecorationBreak: 'clone',
                }}
              >
                best friend
              </span>{' '}
              is in Kainar, near Almaty.
            </h1>
            <p
              style={{
                fontSize: '1.05rem',
                fontWeight: 400,
                color: 'var(--color-muted)',
                lineHeight: 1.55,
                marginBottom: '2rem',
                maxWidth: '440px',
              }}
            >
              Join the Comes Shelter family. 17 years of rescues, one goal: a home for every pet.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => scrollTo(petsRef)}
                style={{
                  padding: '14px 28px',
                  background: ORANGE,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                }}
              >
                Meet our pets
              </button>
              <button
                type="button"
                onClick={() => scrollTo(donateRef)}
                style={{
                  padding: '14px 22px',
                  background: 'transparent',
                  color: DARK,
                  border: 'none',
                  borderBottom: `2px solid ${DARK}`,
                  borderRadius: 0,
                  cursor: 'pointer',
                  fontSize: '0.98rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                }}
              >
                Support the shelter →
              </button>
            </div>
          </div>
        </div>

        <div
          aria-label="Yulia Snegireva at the Comes shelter"
          role="img"
          style={{
            flex: '1 1 360px',
            minWidth: '300px',
            minHeight: '320px',
            backgroundImage: `url('${HERO_IMAGE_URL}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </section>

      <section style={{ textAlign: 'center', padding: 'var(--space-section-y) clamp(1rem, 4vw, 2.5rem)' }}>
        <div style={{ fontSize: '0.75rem', color: '#888', letterSpacing: '0.14em', fontWeight: 600 }}>HOW IT WORKS</div>
        <h2 style={{ fontSize: 'clamp(1.45rem, 3vw, 1.85rem)', margin: '0.5rem 0 1.75rem', color: DARK, fontStyle: 'italic', fontWeight: 600 }}>
          Adoption in <span style={{ color: ORANGE }}>4 simple steps</span>
        </h2>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '0.25rem',
          }}
        >
          {['Choose an animal', 'Read the profile', 'Check requirements', 'Meet & take them home'].map((step, i, arr) => (
            <div key={step} style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      background: ORANGE,
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                    }}
                  >
                    {i + 1}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--color-muted)',
                    maxWidth: '7.5rem',
                    minHeight: '2.75rem',
                    textAlign: 'center',
                    lineHeight: 1.35,
                  }}
                >
                  {step}
                </p>
              </div>
              {i < arr.length - 1 && (
                <div
                  style={{
                    width: '56px',
                    height: '38px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ width: '40px', height: '2px', background: ORANGE, opacity: 0.85 }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section
        ref={petsRef}
        className="page-content-wide scroll-target-section"
        style={{ paddingBottom: 'var(--space-section-y)' }}
      >
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.5rem, 3vw, 1.85rem)', marginBottom: '0.6rem', color: DARK }}>
          Our pets
        </h2>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-muted)',
            fontSize: '1.02rem',
            lineHeight: 1.55,
            maxWidth: '560px',
            margin: '0 auto 1.75rem',
          }}
        >
          These pets are looking for someone like you. Take a moment - your new family member might be one of them.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '1.75rem',
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
            gap: '1.1rem',
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
                  borderRadius: '14px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.06)'
                }}
              >
                {animal.photo_url ? (
                  <img
                    src={animal.photo_url}
                    alt={`Comes Animal Shelter - ${animal.name}, ${animal.type === 'cat' ? 'cat' : 'dog'} available for adoption · приют для животных Comes`}
                    style={{ width: '100%', height: '152px', objectFit: 'contain', background: '#E8DCC8' }}
                  />
                ) : (
                  <div
                    style={{
                      height: '152px',
                      background: '#E8DCC8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                    }}
                  >
                    {animal.type === 'cat' ? '🐈' : '🐕'}
                  </div>
                )}
                <div style={{ padding: '12px 14px' }}>
                  <h3 style={{ fontSize: '1.02rem', color: DARK, fontWeight: 600 }}>{animal.name}</h3>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      padding: '3px 11px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: s.bg,
                      color: s.color,
                    }}
                  >
                    {s.text}
                  </span>
                </div>
              </div>
            )
          })}
          {listLoaded && filtered.length === 0 && (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#888', fontSize: '1rem' }}>
              No animals to show in this category yet.
            </p>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
          <button
            type="button"
            onClick={() => navigate('/animals')}
            style={{
              background: 'transparent',
              border: 'none',
              color: ORANGE,
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              padding: '8px 4px',
              borderBottom: `2px solid ${ORANGE}`,
              borderRadius: 0,
              fontFamily: 'inherit',
            }}
          >
            See the full catalog →
          </button>
        </div>
      </section>

      <section ref={donateRef} className="charity-strip scroll-target-section">
        <div className="page-content-wide charity-inner">
          <h2 style={{ fontSize: 'clamp(1.35rem, 2.5vw, 1.5rem)', color: '#1A5C52', margin: 0 }}>Help the Shelter</h2>

          <div className="charity-qr-row">
            <DonateQr url={DONATE_URL} size={200} />
            <div className="charity-qr-copy">
              <h3>Scan the QR code</h3>
              <p>Or click on it to visit our official donation page.</p>
              <p>
                All contributions go directly to the “Comes” Public Foundation. As a legally registered
                non-profit, we ensure 100% of your donation reaches animals in need with no intermediaries.
              </p>
            </div>
          </div>

          <OtherWaysToDonate />

          <div className="charity-actions">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Comes shelter on Instagram"
              title="Instagram"
              style={iconLinkStyle(DARK)}
            >
              <InstagramIcon />
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message Comes shelter on WhatsApp"
              title="WhatsApp"
              style={iconLinkStyle(DARK)}
            >
              <WhatsAppIcon />
            </a>
            <span
              style={{
                fontSize: '0.95rem',
                color: '#2d4a44',
                fontStyle: 'italic',
              }}
            >
              The shelter is open for interaction.
            </span>
          </div>
        </div>
      </section>

      <section
        ref={newsRef}
        id="news"
        className="page-content-wide scroll-target-section"
        style={{ paddingTop: 'var(--space-section-y)', paddingBottom: 'var(--space-section-y)' }}
      >
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.85rem)', marginBottom: '0.6rem', color: DARK }}>
          News from the shelter
        </h2>
        <p style={{ color: 'var(--color-muted)', marginBottom: '1.75rem' }}>
          One press feature and short Instagram episodes from daily life at Comes. Use the arrows
          (or swipe on mobile) to browse, then tap a card to open it.
        </p>

        <NewsCarousel />
      </section>

      <section
        ref={aboutRef}
        id="about-us"
        className="page-content-wide scroll-target-section"
        style={{ paddingTop: 'var(--space-section-y)', paddingBottom: 'var(--space-section-y)' }}
      >
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.85rem)', marginBottom: '1.25rem', color: DARK }}>
          Who are <span style={{ color: ORANGE }}>PlayFul Paws</span>?
        </h2>

        <div style={{ fontSize: '1.08rem', color: '#3d3d3d', lineHeight: 1.7, maxWidth: 'none' }}>
          <p>
            We are a team of students from{' '}
            <a
              href={INVISIONU_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: ORANGE, fontWeight: 700, borderBottom: `2px solid ${ORANGE}` }}
            >
              inVision U
            </a>{' '}
            <span style={{ color: 'var(--color-muted)', fontSize: '0.95rem', fontStyle: 'italic' }}>
              (Initiative of Arsen Tomsky powered by inDrive)
            </span>
            , brought together by a shared goal - to make animal adoption more accessible and transparent.
          </p>
          <p style={{ marginTop: '1.1rem' }}>
            Today, many shelters struggle with scattered information, limited visibility, and time-consuming communication.
            As a result, animals wait longer to find a home, while people often don’t know where or how to adopt. Our
            project focuses on solving this problem by helping shelters organize their data and making it easier for people
            to explore, connect, and take action.
          </p>
          <p style={{ marginTop: '1.1rem' }}>
            We believe that small improvements in access and information can lead to real change - more adoptions, less time
            on the streets, and better lives for animals.
          </p>
          <p style={{ marginTop: '1.1rem', fontStyle: 'italic', color: 'var(--color-muted)', fontSize: '0.98rem' }}>
            We built this website as part of the discipline{' '}
            <strong style={{ color: DARK, fontStyle: 'normal' }}>Foundations of Computational Thinking</strong>{' '}
            (Foundation Year 2025-2026).
          </p>
        </div>

        <div className="about-images-grid">
          <AboutDesignImage caption="Our team" imageSrc={ABOUT_TEAM_PHOTO} placeholderLabel="Team photo" />
          <AboutDesignImage caption="Concept poster of the project" imageSrc={ABOUT_PROJECT_PHOTO} placeholderLabel="Concept poster of the project" />
        </div>

        <p style={{ fontSize: '1rem', color: 'var(--color-muted)', marginTop: '2rem', textAlign: 'center' }}>
          <strong style={{ color: DARK }}>The members of the PlayFul Paws team:</strong>{' '}
          Balaussa Satymbek, Milena Gukengeimer, Zarina Doszhanova, Aruzhan Yerkinova
        </p>

        <p style={{ fontSize: '1rem', color: 'var(--color-muted)', marginTop: '0.6rem', textAlign: 'center' }}>
          <strong style={{ color: DARK }}>Contact:</strong>{' '}
          <a href="mailto:aruzhan.yerkinova@invisionu.education" style={{ color: ORANGE, fontWeight: 600 }}>
            aruzhan.yerkinova@invisionu.education
          </a>
        </p>
      </section>

      <SiteFooter />
    </div>
  )
}

function AboutDesignImage({ caption, imageSrc, placeholderLabel }) {
  const [broken, setBroken] = useState(false)

  return (
    <figure style={{ margin: 0 }}>
      <div
        style={{
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid rgba(45,45,45,0.1)',
          background: '#E8DCC8',
          aspectRatio: '4 / 3',
          position: 'relative',
        }}
      >
        {!broken ? (
          <img
            src={imageSrc}
            alt={`Comes Animal Shelter - ${caption} · приют для животных Comes`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => setBroken(true)}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '8px',
              color: '#6b5b4a',
              fontSize: '0.95rem',
              fontWeight: 600,
              padding: '1.5rem',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '2rem', opacity: 0.85 }}>▣</span>
            {placeholderLabel}
            <span style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.85 }}>
              Add file: {imageSrc}
            </span>
          </div>
        )}
      </div>
      <figcaption style={{ marginTop: '10px', fontSize: '0.9rem', fontWeight: 600, color: DARK }}>{caption}</figcaption>
    </figure>
  )
}
