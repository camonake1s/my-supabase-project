import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/**
 * Renders a scannable QR code as an <img> (data URL) for the donation URL.
 * Wrapped in <a> so tap/click still opens the same destination.
 */
export default function DonateQr({ url, size = 192 }) {
  const [dataUrl, setDataUrl] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setError(false)
    QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#134a42', light: '#ffffff' },
    })
      .then(s => {
        if (!cancelled) setDataUrl(s)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [url, size])

  const boxStyle = {
    width: size,
    height: size,
    flexShrink: 0,
    borderRadius: 12,
    border: '2px solid #1A5C52',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }

  if (error || !dataUrl) {
    return (
      <div style={{ ...boxStyle, fontSize: '0.75rem', color: '#1A5C52', textAlign: 'center', padding: 8 }}>
        {error ? 'QR unavailable' : '…'}
      </div>
    )
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ lineHeight: 0, flexShrink: 0 }}>
      <img
        src={dataUrl}
        alt="Scan to open the donation page"
        width={size}
        height={size}
        style={{ display: 'block', width: size, height: size }}
      />
    </a>
  )
}
