import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import SiteFooter from './SiteFooter.jsx'

const BG = '#FAF6F0'
const ORANGE = '#C8773A'
const DARK = '#2D2D2D'
const NAV_BG = '#2B2724'
const NAV_FG = '#FAF6F0'

const inputStyle = {
  padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px',
  fontSize: '14px', width: '100%', background: 'white'
}

export default function ApplyPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [animal, setAnimal] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formBanner, setFormBanner] = useState(null)
  const [form, setForm] = useState({
    full_name: '',
    visit_at: '',
    phone: '',
    email: '',
    animal_experience: '',
    living_environment: '',
    consent_given: false
  })

  useEffect(() => {
    let cancelled = false
    supabase.from('animals').select('name').eq('id', id).single()
      .then(({ data }) => { if (!cancelled) setAnimal(data) })
    return () => { cancelled = true }
  }, [id])

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setFormBanner(null)
  }

  function emailLooksValid(s) {
    const t = s.trim()
    if (!t) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
  }

  async function handleSubmit() {
    setFormBanner(null)
    const name = form.full_name.trim()
    const phone = form.phone.trim()
    if (name.length < 2 || phone.length < 5 || !form.consent_given || !emailLooksValid(form.email)) {
      setFormBanner({ type: 'error', text: 'Please fill in all required fields correctly.' })
      return
    }

    setLoading(true)
    const { error } = await supabase.from('adoptions').insert({
      animal_id: Number(id),
      full_name: name,
      phone,
      email: form.email.trim() || null,
      visit_at: form.visit_at ? new Date(form.visit_at).toISOString() : null,
      animal_experience: form.animal_experience || null,
      living_environment: form.living_environment || null,
      consent_given: true
    })
    setLoading(false)
    if (error) {
      setFormBanner({
        type: 'error',
        text: 'Something went wrong and we could not save your application. Please try again.',
      })
      return
    }
    setSubmitted(true)
  }

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', rowGap: '12px',
        padding: '14px 40px',
        background: NAV_BG,
        color: NAV_FG,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
        borderBottom: '1px solid rgba(0,0,0,0.25)',
      }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', color: NAV_FG }}
             onClick={() => navigate('/')}>🐾 PlayFul Paws</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={() => navigate('/')} style={{
            padding: '10px 18px',
            border: '1px solid rgba(250,246,240,0.35)',
            background: 'rgba(250,246,240,0.1)',
            color: NAV_FG,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}>Home</button>
          <button type="button" onClick={() => navigate(-1)} style={{
            padding: '10px 18px',
            border: '1px solid rgba(250,246,240,0.35)',
            background: 'rgba(250,246,240,0.1)',
            color: NAV_FG,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}>← Back</button>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{
          background: 'white', borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }}>
          <div style={{ background: ORANGE, padding: '24px 32px' }}>
            <h2 style={{ color: 'white', fontSize: '22px', marginBottom: '4px' }}>Adoption Application</h2>
            <p style={{ color: '#FAE5D3', fontSize: '14px' }}>
              {animal?.name ? `${animal.name} — ` : ''}Your application will be sent to our team
            </p>
          </div>

          <div style={{ padding: '32px' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div
                  role="status"
                  style={{
                    margin: '0 auto 20px',
                    maxWidth: '28rem',
                    padding: '14px 18px',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 600,
                    background: '#E8F5E9',
                    color: '#1B5E20',
                    border: '1px solid #A5D6A7',
                  }}
                >
                  Your application has been submitted successfully.
                </div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <h3 style={{ fontSize: '20px', color: DARK, marginBottom: '8px' }}>Thank you!</h3>
                <p style={{ color: '#666', marginBottom: '24px' }}>The shelter team will contact you soon.</p>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    padding: '12px 32px', background: ORANGE, color: 'white',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px'
                  }}
                >Back to main page</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {formBanner && formBanner.type === 'error' && (
                  <div
                    role="alert"
                    style={{
                      padding: '14px 18px',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 600,
                      lineHeight: 1.45,
                      background: '#FFEBEE',
                      color: '#B71C1C',
                      border: '1px solid #FFCDD2',
                    }}
                  >
                    {formBanner.text}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Field label="Full Name *">
                    <input
                      style={inputStyle} placeholder="Your name"
                      value={form.full_name}
                      onChange={e => update('full_name', e.target.value)}
                    />
                  </Field>
                  <Field label="Visit Date / Time (preferred)">
                    <input
                      type="datetime-local" style={inputStyle}
                      value={form.visit_at}
                      onChange={e => update('visit_at', e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Phone (WhatsApp) *">
                  <input
                    style={inputStyle} placeholder="+7 ..."
                    value={form.phone}
                    onChange={e => update('phone', e.target.value)}
                  />
                </Field>

                <Field label="Email">
                  <input
                    style={inputStyle} placeholder="email@example.com"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                  />
                </Field>

                <Field label="Do you have experience with animals?">
                  <input
                    style={inputStyle} placeholder="Yes / No / Tell us more"
                    value={form.animal_experience}
                    onChange={e => update('animal_experience', e.target.value)}
                  />
                </Field>

                <Field label="Details about your living environment">
                  <input
                    style={inputStyle} placeholder="House, apartment, yard..."
                    value={form.living_environment}
                    onChange={e => update('living_environment', e.target.value)}
                  />
                </Field>

                {/* Consent — required before submission */}
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  background: '#FAF0E6', padding: '12px 14px', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '13px', color: '#555', lineHeight: 1.5
                }}>
                  <input
                    type="checkbox" style={{ marginTop: '3px' }}
                    checked={form.consent_given}
                    onChange={e => update('consent_given', e.target.checked)}
                  />
                  <span>
                    I agree to send my data to the “Comes” shelter team so they can contact me about
                    this adoption request.
                  </span>
                </label>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    padding: '14px',
                    background: loading ? '#ccc' : '#7B3F1E',
                    color: 'white', border: 'none', borderRadius: '8px',
                    fontSize: '16px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: '8px'
                  }}
                >{loading ? 'Sending…' : 'Submit Application'}</button>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
