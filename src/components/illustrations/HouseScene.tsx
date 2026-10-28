import { motion } from "motion/react"
import type { ColorKey } from "@/lib/types"
import { BlobFigure, type Mood } from "./Blob"

const INK = "#231942"
const line = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const }

/** Window slots, in the order housemates move in. */
const SLOTS = [
  { x: 96, y: 160, w: 54, h: 48 },
  { x: 210, y: 160, w: 54, h: 48 },
  { x: 96, y: 222, w: 54, h: 44 },
  { x: 210, y: 222, w: 54, h: 44 },
]

interface Resident {
  color: ColorKey
  shape: number
}

export function HouseScene({
  residents,
  sign,
  mood = "happy",
  className,
}: {
  residents: Resident[]
  sign?: string
  mood?: Mood
  className?: string
}) {
  const inWindows = residents.slice(0, 4)
  const atDoor = residents.slice(4, 6)
  const label = sign && sign.length > 16 ? `${sign.slice(0, 15)}…` : sign

  return (
    <svg viewBox="0 0 360 310" className={className} role="img" aria-label={sign ? `${sign}, with everyone at home` : "A house"}>
      <defs>
        {SLOTS.map((s, i) => (
          <clipPath key={i} id={`win-${i}`}>
            <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="14" />
          </clipPath>
        ))}
      </defs>

      {/* sky bits */}
      <circle cx="306" cy="58" r="24" fill="#FFC83D" {...line} className="origin-center animate-[float_5s_ease-in-out_infinite]" style={{ transformBox: "fill-box" }} />
      <g className="animate-[float_6s_ease-in-out_infinite]">
        <path d="M30 86a14 14 0 0 1 22-14 18 18 0 0 1 33 6 12 12 0 0 1 1 24H38a12 12 0 0 1-8-16Z" fill="#fff" {...line} />
      </g>

      {/* ground */}
      <ellipse cx="180" cy="288" rx="158" ry="14" fill="#8B6CFF" opacity="0.16" />

      {/* chimney + bubbles */}
      <rect x="238" y="64" width="28" height="56" rx="7" fill="#FF9248" {...line} />
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={250 + i * 6}
          cy={54}
          r={6 + i * 2}
          fill="#fff"
          fillOpacity="0.85"
          stroke={INK}
          strokeWidth="3"
          className="animate-rise"
          style={{ animationDelay: `${i * 0.8}s`, transformBox: "fill-box", transformOrigin: "center" }}
        />
      ))}

      {/* body */}
      <rect x="72" y="126" width="216" height="158" rx="24" fill="#fff" {...line} />
      {/* roof */}
      <path d="M52 140L170 50Q180 42 190 50L308 140Q316 148 306 148H54Q44 148 52 140Z" fill="#FF6FAE" {...line} />
      <path d="M96 124L170 68" stroke="#fff" strokeOpacity="0.5" strokeWidth="6" strokeLinecap="round" />

      {/* windows with housemates peeking out */}
      {SLOTS.map((s, i) => {
        const r = inWindows[i]
        return (
          <g key={i}>
            <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="14" fill="#D6EDFF" />
            {r && (
              <g clipPath={`url(#win-${i})`}>
                <motion.g
                  initial={{ y: 40 }}
                  animate={{ y: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.35 + i * 0.14 }}
                >
                  <g transform={`translate(${s.x + 6} ${s.y + 8}) scale(0.42)`}>
                    <BlobFigure color={r.color} shape={r.shape} mood={mood} />
                  </g>
                </motion.g>
              </g>
            )}
            <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="14" fill="none" {...line} />
            <path d={`M${s.x + s.w / 2} ${s.y}V${s.y + s.h}`} stroke={INK} strokeWidth="3" opacity={r ? 0 : 0.5} />
          </g>
        )
      })}

      {/* door */}
      <path d="M156 284V232a24 24 0 0 1 48 0v52Z" fill="#FFC83D" {...line} />
      <circle cx="194" cy="258" r="3.5" fill={INK} />

      {/* extra housemates wait by the door */}
      {atDoor.map((r, i) => (
        <motion.g
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.95 + i * 0.14 }}
          style={{ transformOrigin: `${i === 0 ? 40 : 320}px 280px` }}
        >
          <g transform={`translate(${i === 0 ? 18 : 296} 238) scale(0.48)`}>
            <BlobFigure color={r.color} shape={r.shape} mood={mood} />
          </g>
        </motion.g>
      ))}

      {/* bushes */}
      {!atDoor[0] && (
        <path d="M44 284a16 16 0 0 1 4-24 18 18 0 0 1 32 4 14 14 0 0 1 4 20Z" fill="#2ED3A1" {...line} />
      )}
      {!atDoor[1] && (
        <path d="M282 284a14 14 0 0 1 6-22 16 16 0 0 1 28 6 12 12 0 0 1 2 16Z" fill="#2ED3A1" {...line} />
      )}

      {/* name sign */}
      {label && (
        <motion.g
          initial={{ rotate: -8, y: -10, opacity: 0 }}
          animate={{ rotate: 0, y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
          style={{ transformOrigin: "180px 92px" }}
        >
          <path d="M152 92V82M208 92V82" stroke={INK} strokeWidth="3" />
          <rect x="112" y="92" width="136" height="34" rx="17" fill="#fff" {...line} />
          <text x="180" y="115" textAnchor="middle" fontFamily="var(--font-heading)" fontWeight="800" fontSize="16" fill={INK}>
            {label}
          </text>
        </motion.g>
      )}
    </svg>
  )
}
