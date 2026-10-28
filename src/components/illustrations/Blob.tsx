import { useId } from "react"
import { COLORS } from "@/lib/starter"
import type { ColorKey } from "@/lib/types"

const INK = "#231942"

/** Six body shapes, so every housemate has their own silhouette as well as a color. */
const BODIES = [
  "M50 9C76 9 92 27 92 53C92 78 74 94 50 94C26 94 8 78 8 53C8 27 24 9 50 9Z",
  "M50 7C70 7 83 21 83 44C83 61 90 71 88 81C85 93 68 95 50 95C32 95 15 93 12 81C10 71 17 61 17 44C17 21 30 7 50 7Z",
  "M50 11C81 11 90 19 90 51C90 83 81 92 50 92C19 92 10 83 10 51C10 19 19 11 50 11Z",
  "M50 5C59 19 90 37 90 62C90 82 72 95 50 95C28 95 10 82 10 62C10 37 41 19 50 5Z",
  "M52 9C70 7 87 19 89 38C91 54 97 66 89 80C80 95 60 95 46 93C28 91 10 85 9 66C7 48 14 36 22 25C30 13 40 10 52 9Z",
  "M31 31C31 17 44 9 54 15C62 7 80 11 80 27C92 31 94 47 90 57C94 71 87 94 50 94C14 94 6 74 10 58C4 46 13 32 31 31Z",
]

export type Mood = "happy" | "joy" | "sleepy" | "wow" | "cool"

function Face({ mood, blink }: { mood: Mood; blink: string }) {
  const stroke = { stroke: INK, strokeWidth: 3.6, strokeLinecap: "round" as const, fill: "none" }
  return (
    <g>
      {/* cheeks */}
      <ellipse cx="27" cy="64" rx="6.5" ry="4" fill="#FF4F9A" opacity="0.32" />
      <ellipse cx="73" cy="64" rx="6.5" ry="4" fill="#FF4F9A" opacity="0.32" />
      {mood === "joy" && (
        <>
          <path d="M31 53Q38 44 45 53" {...stroke} />
          <path d="M55 53Q62 44 69 53" {...stroke} />
          <path d="M41 62Q50 76 59 62Z" fill={INK} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M45 67.5Q50 72 55 67.5" fill="#FF6FAE" />
        </>
      )}
      {mood === "sleepy" && (
        <>
          <path d="M31 53Q38 58 45 53" {...stroke} />
          <path d="M55 53Q62 58 69 53" {...stroke} />
          <ellipse cx="50" cy="67" rx="3.4" ry="4" fill={INK} />
        </>
      )}
      {mood === "cool" && (
        <>
          <path d="M26 46H74" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          <rect x="28" y="45" width="19" height="13" rx="6.5" fill={INK} />
          <rect x="53" y="45" width="19" height="13" rx="6.5" fill={INK} />
          <path d="M32 49L36 49" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
          <path d="M43 65Q50 72 57 65" {...stroke} />
        </>
      )}
      {(mood === "happy" || mood === "wow") && (
        <>
          <g className="blob-eyes" style={{ animationDelay: blink }}>
            <ellipse cx="38" cy="51" rx={mood === "wow" ? 9 : 8} ry={mood === "wow" ? 10.5 : 9.5} fill="#fff" />
            <ellipse cx="62" cy="51" rx={mood === "wow" ? 9 : 8} ry={mood === "wow" ? 10.5 : 9.5} fill="#fff" />
            <circle cx="39.5" cy="52.5" r={mood === "wow" ? 4 : 4.6} fill={INK} />
            <circle cx="63.5" cy="52.5" r={mood === "wow" ? 4 : 4.6} fill={INK} />
            <circle cx="41" cy="50.5" r="1.5" fill="#fff" />
            <circle cx="65" cy="50.5" r="1.5" fill="#fff" />
          </g>
          {mood === "wow" ? (
            <ellipse cx="50" cy="69" rx="4.5" ry="5.5" fill={INK} />
          ) : (
            <path d="M43 65Q50 72 57 65" {...stroke} />
          )}
        </>
      )}
    </g>
  )
}

export interface BlobProps {
  color: ColorKey
  shape?: number
  mood?: Mood
}

/** The character as an SVG group, for use inside larger illustrations (100x100 units). */
export function BlobFigure({ color, shape = 0, mood = "happy" }: BlobProps) {
  const c = COLORS[color]
  const blink = `${(shape * 0.73 + color.length * 0.41) % 4}s`
  const body = BODIES[shape % BODIES.length]
  const clip = useId()
  return (
    <g>
      <clipPath id={clip}>
        <path d={body} />
      </clipPath>
      <path d={body} fill={c.fill} />
      {/* soft belly shade + shine, clipped to the body */}
      <g clipPath={`url(#${clip})`}>
        <ellipse cx="50" cy="104" rx="52" ry="26" fill={c.deep} opacity="0.35" />
        <ellipse cx="33" cy="25" rx="11" ry="6" fill="#fff" opacity="0.45" transform="rotate(-24 33 25)" />
      </g>
      <path d={body} fill="none" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <Face mood={mood} blink={blink} />
    </g>
  )
}

export function Blob({
  size = 48,
  className,
  title,
  ...props
}: BlobProps & { size?: number; className?: string; title?: string }) {
  return (
    <svg
      viewBox="-4 -4 108 108"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <BlobFigure {...props} />
    </svg>
  )
}
