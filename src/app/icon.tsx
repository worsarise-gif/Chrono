import { ImageResponse } from 'next/og'

// Image metadata - Project Chrono
export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Rotated wrapper for Satori compatibility */}
          <div
            style={{
              display: 'flex',
              transform: 'rotate(-45deg)',
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 100 100"
            >
              {/* Top-left piece with mathematically mapped flare curve */}
              <path
                d="M 2 45 L 32.7 45 A 18 18 0 0 1 67.3 45 L 85.6 45 A 36 36 0 0 0 25.3 25.3 C 17.3 33.3, 10 44, 2 45 Z"
                fill="#1a1a1a"
              />
              {/* Bottom-right piece (exact 180 degree rotation of the top-left) */}
              <path
                d="M 98 55 L 67.3 55 A 18 18 0 0 1 32.7 55 L 14.4 55 A 36 36 0 0 0 74.7 74.7 C 82.7 66.7, 90 56, 98 55 Z"
                fill="#1a1a1a"
              />
            </svg>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
