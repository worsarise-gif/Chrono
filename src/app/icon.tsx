import { ImageResponse } from 'next/og'

// Image metadata
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
          <span
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: '#1a1a1a',
              fontFamily: 'Arial, Helvetica, sans-serif',
              lineHeight: 1,
              transform: 'translateY(1px)', // slight visual centering tweak
            }}
          >
            C
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
