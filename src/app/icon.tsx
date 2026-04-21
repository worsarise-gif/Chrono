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
        <svg
          viewBox="0 0 800 800"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          {/* White circular background */}
          <circle
            cx="400"
            cy="400"
            r="400"
            fill="#ffffff"
          />

          {/* Text */}
          <text
            x="400"
            y="425"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="Arial Black, Helvetica, sans-serif"
            fontSize="195"
            fontWeight="900"
            fill="#1a1a1a"
            letterSpacing="-6"
            paintOrder="stroke fill"
            stroke="#ffffff"
            strokeWidth="10"
          >
            Chrono
          </text>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
