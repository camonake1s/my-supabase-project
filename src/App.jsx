import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import DonateQr from './DonateQr.jsx'
import SiteFooter from './SiteFooter.jsx'

const BG = '#FAF6F0'
const ORANGE = '#C8773A'
const ACCENT = '#FF9F1C'
const DARK = '#1f1f1f'
const NAV_BG = '#2B2724'
const NAV_FG = '#FAF6F0'

const INSTAGRAM_URL = 'https://www.instagram.com/comes.kz.almaty/'
const WHATSAPP_URL = 'https://api.whatsapp.com/send?phone=7017230104'
const DONATE_URL = 'https://scan.page/zJh9WM'
const INVISIONU_URL = 'https://www.invisionu.education/'

/** Original design assets — add these files under public/about/ */
const ABOUT_TEAM_PHOTO = '/about/team-photo.jpg'
const ABOUT_PROJECT_PHOTO = '/about/project-mockup.jpg'

const HERO_IMAGE_URL = 'https://i.pinimg.com/736x/16/bd/d9/16bdd92a5093b8166b4b31f322536220.jpg'

const NEWS_ARTICLE_URL =
  'https://informburo.kz/stati/priiut-nadezdy-kak-bliz-almaty-spasaiut-tex-kogo-odnazdy-predali-liudi'
const NEWS_ARTICLE_PHOTO = 'https://i.pinimg.com/736x/f6/dd/f9/f6ddf96b7c3c2d69903efeb25f7e590e.jpg'

function statusLabel(s) {
  if (s === 'treatment') return { text: 'Under Treatment', bg: '#FFF3E0', color: '#E65100' }
  if (s === 'urgent') return { text: 'Needs Urgent Support', bg: '#FFEBEE', color: '#C62828' }
  return { text: 'Looking for home', bg: '#E8F5E9', color: '#2E7D32' }
}

export default function App() {
  const navigate = useNavigate()
  const petsRef = useRef(null)
  const donateRef = useRef(null)
  const aboutRef = useRef(null)

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
          🐾 PlayFul Paws
        </div>
        <nav style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => scrollTo(petsRef)} style={navBtn}>
            Find an Animal
          </button>
          <button type="button" onClick={() => scrollTo(donateRef)} style={navBtn}>
            Charity
          </button>
          <button type="button" onClick={() => scrollTo(aboutRef)} style={navBtn}>
            About Us
          </button>
        </nav>
      </header>

      <section
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%), url('${HERO_IMAGE_URL}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: 'clamp(420px, 56vw, 620px)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          className="page-content-wide"
          style={{
            paddingTop: 'clamp(3rem, 8vw, 5rem)',
            paddingBottom: 'clamp(3rem, 8vw, 5rem)',
            width: '100%',
          }}
        >
          <div style={{ maxWidth: '560px' }}>
            <h1
              style={{
                fontSize: 'clamp(2rem, 5vw, 2.5rem)',
                fontWeight: 700,
                color: '#FFFFFF',
                lineHeight: 1.1,
                marginBottom: '0.85rem',
              }}
            >
              Comes Animal Shelter
            </h1>
            <p
              style={{
                fontSize: '1.1rem',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '1.5rem',
              }}
            >
              📍 Kainar Village, Almaty Region
            </p>
            <div
              style={{
                color: ACCENT,
                fontSize: '0.9rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '2rem',
              }}
            >
              Founded by Yulia Snigireva • 17 Years of Compassion
            </div>
            <button
              type="button"
              onClick={() => scrollTo(donateRef)}
              style={{
                padding: '14px 30px',
                background: ACCENT,
                color: '#1A1A1A',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 700,
                boxShadow: '0 6px 18px rgba(255,159,28,0.4)',
                fontFamily: 'inherit',
              }}
            >
              Support the Shelter
            </button>
          </div>
        </div>
      </section>

      <section
        className="page-content-wide"
        style={{ paddingTop: 'var(--space-section-y)', paddingBottom: '0' }}
      >
        <article
          style={{
            background: 'white',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: '14px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            maxWidth: '720px',
            margin: '0 auto',
          }}
        >
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
            }}
          >
            <div
              aria-hidden
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#1A5C52',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.15rem',
                flexShrink: 0,
              }}
            >
              📰
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: DARK }}>informburo.kz</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                News · Featured story
              </div>
            </div>
          </header>

          <div style={{ padding: '4px 18px 16px' }}>
            <h3
              style={{
                fontSize: '1.18rem',
                color: DARK,
                lineHeight: 1.3,
                marginBottom: '0.55rem',
              }}
            >
              Shelter “Hope”: how near Almaty they rescue those once betrayed by people
            </h3>
            <p style={{ fontSize: '0.97rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
              More than 400 dogs and cats are cared for at the Comes shelter in Almaty region.
              Operating since 2018, it was founded by siblings Sergey and Yulia Snegirev, who give
              every rescued animal rehabilitation, treatment, and a careful path to a new family.
              Adopters are asked to send regular updates from the animal’s new home, so the shelter
              knows each rescue is safe and loved.
            </p>
          </div>

          <img
            src={NEWS_ARTICLE_PHOTO}
            alt="Rescued cat at the Comes shelter"
            style={{
              width: '100%',
              height: 'clamp(220px, 38vw, 360px)',
              objectFit: 'contain',
              background: '#E8DCC8',
              display: 'block',
            }}
          />

          <footer
            style={{
              padding: '14px 18px',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              Source: informburo.kz
            </span>
            <a
              href={NEWS_ARTICLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: ORANGE, fontWeight: 600, fontSize: '0.95rem' }}
            >
              Read the full article →
            </a>
          </footer>
        </article>
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
        <h2 style={{ textAlign: 'center', fontSize: '1.45rem', marginBottom: '1.35rem', color: DARK }}>Our pets</h2>

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
                  <img src={animal.photo_url} alt="" style={{ width: '100%', height: '152px', objectFit: 'contain', background: '#E8DCC8' }} />
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
      </section>

      <section ref={donateRef} className="charity-strip scroll-target-section">
        <div className="page-content-wide charity-inner">
          <h2 style={{ fontSize: 'clamp(1.35rem, 2.5vw, 1.5rem)', color: '#1A5C52', margin: 0 }}>Help the Shelter</h2>

          <div className="charity-qr-row">
            <DonateQr url={DONATE_URL} size={200} />
            <div className="charity-qr-copy">
              <h3>Scan the QR code</h3>
              <p>Open your phone camera and point it at the code - you will be taken to the official donation page.</p>
              <p>All donations go directly to the “Comes” foundation. No intermediaries.</p>
            </div>
          </div>

          <div className="charity-actions">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <button
                type="button"
                style={{
                  padding: '11px 24px',
                  border: `2px solid ${DARK}`,
                  background: 'white',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  color: DARK,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                Instagram
              </button>
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <button
                type="button"
                style={{
                  padding: '11px 24px',
                  border: `2px solid ${DARK}`,
                  background: 'white',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  color: DARK,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                WhatsApp
              </button>
            </a>
          </div>
        </div>
      </section>

      <section
        ref={aboutRef}
        id="about-us"
        className="page-content-wide scroll-target-section"
        style={{ paddingTop: 'var(--space-section-y)', paddingBottom: 'var(--space-section-y)' }}
      >
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.85rem)', marginBottom: '1.25rem', color: DARK }}>
          About Us - <span style={{ color: ORANGE }}>PlayFul Paws</span>
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
            </a>
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
        </div>

        <div className="about-images-grid">
          <AboutDesignImage caption="Our team" imageSrc={ABOUT_TEAM_PHOTO} placeholderLabel="Team photo" />
          <AboutDesignImage caption="Concept poster of the project" imageSrc={ABOUT_PROJECT_PHOTO} placeholderLabel="Concept poster of the project" />
        </div>

        <p style={{ fontSize: '1rem', color: 'var(--color-muted)', marginTop: '2rem', textAlign: 'center' }}>
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
            alt={caption}
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
