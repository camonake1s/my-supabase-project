import { useNavigate } from 'react-router-dom'
import SiteFooter from './SiteFooter.jsx'

const BG = '#FAF6F0'
const ORANGE = '#C8773A'
const DARK = '#1f1f1f'
const TEAL = '#1A5C52'
const NAV_BG = '#1A5C52'
const NAV_FG = '#FAF6F0'

const HERO_IMAGE_URL =
  'https://i.pinimg.com/736x/16/bd/d9/16bdd92a5093b8166b4b31f322536220.jpg'
const DONATE_URL = 'https://scan.page/zJh9WM'

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

function Stat({ value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)', fontWeight: 700, color: TEAL, lineHeight: 1 }}>
        {value}
      </div>
      <div
        style={{
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--color-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginTop: '0.4rem',
        }}
      >
        {label}
      </div>
    </div>
  )
}

function StoryHeading({ children }) {
  return (
    <h2
      style={{
        fontSize: 'clamp(1.4rem, 2.5vw, 1.7rem)',
        color: DARK,
        marginTop: '2.5rem',
        marginBottom: '0.85rem',
      }}
    >
      {children}
    </h2>
  )
}

function StoryParagraph({ children }) {
  return (
    <p style={{ fontSize: '1.05rem', color: '#3d3d3d', lineHeight: 1.7, margin: '0 0 1rem' }}>
      {children}
    </p>
  )
}

export default function StoryPage() {
  const navigate = useNavigate()

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
          <button type="button" onClick={() => navigate('/animals')} style={navBtn}>
            Find an Animal
          </button>
        </nav>
      </header>

      <main
        className="page-content-wide"
        style={{
          paddingTop: 'var(--space-section-y)',
          paddingBottom: 'var(--space-section-y)',
          maxWidth: 'min(820px, calc(100vw - 2rem))',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(2.1rem, 5vw, 3rem)',
            color: DARK,
            lineHeight: 1.15,
            marginBottom: '0.6rem',
          }}
        >
          Our Story
        </h1>
        <p
          style={{
            fontSize: '1.15rem',
            color: 'var(--color-muted)',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          How two siblings turned a private plot of land in Kainar into a refuge for the animals.
        </p>

        <img
          src={HERO_IMAGE_URL}
          alt="Comes Animal Shelter - Yulia Snegireva at the shelter in Kainar village · приют для животных Comes"
          style={{
            width: '100%',
            height: 'clamp(220px, 38vw, 360px)',
            objectFit: 'cover',
            borderRadius: '14px',
            marginBottom: '2rem',
          }}
        />

        <section
          aria-label="Comes shelter at a glance"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1.25rem',
            background: 'white',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: '14px',
            padding: '1.5rem',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <Stat value="17+" label="Years of rescue" />
          <Stat value="350" label="Dogs" />
          <Stat value="40+" label="Cats" />
          <Stat value="5-10" label="Rescues / month" />
          <Stat value="50" label="Adoption inquiries / month" />
        </section>

        <StoryHeading>Who runs Comes</StoryHeading>
        <StoryParagraph>
          <strong>Yulia Snegireva</strong> founded Comes about seventeen years ago and still runs every part of it
          herself - feeding, veterinary coordination, social media, adoption interviews, and the daily care of
          every animal on the grounds. Her older brother <strong>Sergei Snegirev</strong> works alongside her as
          co-organizer.
        </StoryParagraph>
        <StoryParagraph>
          Comes is a two-person operation. There is no paid staff, no agency partnership, no large overhead - just
          two siblings who decided that the animals nobody else would help still deserved a chance.
        </StoryParagraph>

        <StoryHeading>Animals our shelter accepts</StoryHeading>
        <StoryParagraph>
          We focus on the hardest cases: animals hit by vehicles on the street, victims of cruelty, severely sick
          or injured strays. These are the animals that would otherwise have no prospect of survival or recovery.
        </StoryParagraph>
        <StoryParagraph>
          Today the shelter is home to around <strong>350 dogs</strong> and <strong>more than 40 cats</strong>,
          all kept on a private plot of land where Yulia and Sergei have built additional enclosures and improved
          the territory year after year.
        </StoryParagraph>

        <StoryHeading>From street to home</StoryHeading>
        <ol style={{ paddingLeft: '1.25rem', color: '#3d3d3d', lineHeight: 1.7, fontSize: '1.05rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Rescue:</strong> We respond to reports of injured animals or find them during field missions.
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Treatment:</strong> Animals are treated at partner clinics in Almaty for surgery and
            stabilization.
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Rehabilitation:</strong> Post-treatment, animals recover under professional care at our
            shelter in Kainar.
          </li>
          <li>
            <strong>Adoption:</strong> We facilitate the transition to permanent, verified homes once the animal
            is fully recovered.
          </li>
        </ol>

        <StoryHeading>Viktoria's story</StoryHeading>
        <article
          style={{
            background: 'linear-gradient(165deg, #f4ebe0 0%, #ede4d8 100%)',
            border: '1px solid rgba(200, 119, 58, 0.45)',
            borderRadius: '14px',
            padding: '1.4rem 1.6rem',
            marginBottom: '1rem',
          }}
        >
          <p style={{ fontSize: '1.02rem', color: '#3a3a3a', lineHeight: 1.7, margin: 0 }}>
            Viktoria was a stray cat who slipped into an apartment building hallway to escape the cold. A resident
            poured a powerful chemical solvent on her. She arrived at the clinic in critical condition and has
            since undergone <strong>three skin-graft surgeries</strong>. She is recovering well - and she is
            recovering only because the shelter's followers funded every step of her treatment, post by post,
            comment by comment. This is what Comes does on a daily basis.
          </p>
        </article>

        <StoryHeading>Where to find us</StoryHeading>
        <StoryParagraph>
          The shelter is located in the village of <strong>Kaynar</strong>, on the outskirts of Almaty, Kazakhstan.
          Comes is officially registered as a <strong>public foundation</strong>, which gives it a legal basis to
          accept charitable donations from the public.
        </StoryParagraph>
        <StoryParagraph>
          The two main partner clinics are inside Almaty itself - the team has cooperated with them for many
          years to handle every surgery and emergency intake.
        </StoryParagraph>

        <div
          style={{
            marginTop: '2.5rem',
            padding: '1.6rem 1.8rem',
            background: 'white',
            border: `1px solid ${TEAL}`,
            borderRadius: '14px',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', color: DARK, margin: '0 0 0.2rem' }}>
              Adopting saves two lives
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-muted)', margin: 0 }}>
              The one you take home and the one whose space they free.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('/animals')}
              style={{
                padding: '12px 24px',
                background: ORANGE,
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.98rem',
                fontWeight: 700,
                fontFamily: 'inherit',
              }}
            >
              Meet our pets
            </button>
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '12px 22px',
                background: 'transparent',
                color: DARK,
                border: 'none',
                borderBottom: `2px solid ${DARK}`,
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Support the shelter ↗
            </a>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
