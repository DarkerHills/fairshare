import type { ColorKey } from "@/lib/types"
import { BlobFigure } from "./Blob"

const INK = "#231942"
const line = { stroke: INK, strokeWidth: 4.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const }

/** Loading: a little washing machine on spin, with a dizzy housemate in the drum. */
export function WashingMachine({ className, color = "sponge" }: { className?: string; color?: ColorKey }) {
  return (
    <svg viewBox="0 0 220 250" className={className} aria-hidden>
      <ellipse cx="110" cy="236" rx="80" ry="9" fill="#8B6CFF" opacity="0.18" />
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          cx={70 + i * 26}
          cy={24}
          r={5 + (i % 2) * 3}
          fill="#fff"
          stroke={INK}
          strokeWidth="3"
          className="animate-rise"
          style={{ animationDelay: `${i * 0.55}s`, transformBox: "fill-box", transformOrigin: "center" }}
        />
      ))}
      <g style={{ animation: "rumble 0.32s linear infinite", transformOrigin: "110px 230px" }}>
        <rect x="46" y="222" width="22" height="12" rx="4" fill={INK} />
        <rect x="152" y="222" width="22" height="12" rx="4" fill={INK} />
        <rect x="28" y="36" width="164" height="192" rx="30" fill="#fff" {...line} />
        <path d="M28 82H192" {...line} />
        <circle cx="62" cy="59" r="10" fill="#8B6CFF" {...line} strokeWidth={3.5} />
        <rect x="88" y="52" width="40" height="14" rx="7" fill="#ECE9FA" stroke={INK} strokeWidth="3" />
        <circle cx="150" cy="59" r="5.5" fill="#2ED3A1" stroke={INK} strokeWidth="3" className="animate-pulse" />
        <circle cx="168" cy="59" r="5.5" fill="#FF6FAE" stroke={INK} strokeWidth="3" />
        <clipPath id="drum">
          <circle cx="110" cy="152" r="50" />
        </clipPath>
        <circle cx="110" cy="152" r="62" fill="#ECE9FA" {...line} />
        <circle cx="110" cy="152" r="50" fill="#D6EDFF" />
        <g clipPath="url(#drum)">
          {/* sloshing water */}
          <g style={{ animation: "wave-slide 1.6s linear infinite" }}>
            <path
              d="M40 160q15-10 30 0t30 0 30 0 30 0 30 0 30 0 30 0 30 0V220H40Z"
              fill="#5AB8FF"
              opacity="0.75"
            />
          </g>
          {/* the spin */}
          <g style={{ animation: "spin-drum 1.4s linear infinite", transformOrigin: "110px 152px" }}>
            <g transform="translate(84 126) scale(0.52)">
              <BlobFigure color={color} shape={0} mood="wow" />
            </g>
            <path d="M72 120l10-6 8 5 8-5 10 6-4 8h-4v14h-20v-14h-4Z" fill="#FF6FAE" stroke={INK} strokeWidth="3" strokeLinejoin="round" transform="rotate(160 110 152)" />
            <path d="M140 168c0-6 4-8 8-8h4v14c0 4-3 6-6 6h-10c-3 0-4-4 0-6l4-2Z" fill="#FFC83D" stroke={INK} strokeWidth="3" strokeLinejoin="round" transform="rotate(-30 110 152)" />
            <circle cx="96" cy="190" r="5" fill="#fff" stroke={INK} strokeWidth="2.5" />
            <circle cx="136" cy="118" r="4" fill="#fff" stroke={INK} strokeWidth="2.5" />
          </g>
        </g>
        <circle cx="110" cy="152" r="50" fill="none" {...line} />
        <path d="M82 124a40 40 0 0 1 20-12" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
      </g>
    </svg>
  )
}

/** All done: someone soaking in a bubble bath, with a rubber duck. */
export function BubbleBath({ className, color, shape }: { className?: string; color: ColorKey; shape: number }) {
  const foam = [
    [58, 96, 14], [80, 90, 16], [104, 94, 13], [176, 92, 15], [198, 96, 13], [218, 100, 11], [40, 102, 10],
  ]
  return (
    <svg viewBox="0 0 280 210" className={className} aria-hidden>
      <ellipse cx="140" cy="196" rx="112" ry="9" fill="#8B6CFF" opacity="0.18" />
      {/* faucet */}
      <path d="M244 104V62q0-14 -14-14h-10" fill="none" {...line} strokeWidth={8} stroke={INK} />
      <path d="M244 104V62q0-14 -14-14h-10" fill="none" stroke="#B3ABD9" strokeWidth="3.5" strokeLinecap="round" />
      {/* bather */}
      <g transform="translate(96 40) scale(0.86)" className="animate-wobble" style={{ transformOrigin: "140px 120px" }}>
        <BlobFigure color={color} shape={shape} mood="cool" />
      </g>
      {/* rising bubbles */}
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={70 + i * 70}
          cy={70}
          r={6 + i * 1.5}
          fill="#fff"
          stroke={INK}
          strokeWidth="3"
          className="animate-rise"
          style={{ animationDelay: `${i * 0.9}s`, transformBox: "fill-box", transformOrigin: "center" }}
        />
      ))}
      {/* foam */}
      {foam.map(([x, y, r], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill="#fff"
          stroke={INK}
          strokeWidth="3.5"
          className="animate-float"
          style={{ animationDelay: `${i * 0.35}s`, animationDuration: `${3 + (i % 3)}s` }}
        />
      ))}
      {/* tub */}
      <path d="M22 104H258Q264 104 262 112L250 154Q242 184 210 184H70Q38 184 30 154L18 112Q16 104 22 104Z" fill="#fff" {...line} />
      <path d="M40 120H238" stroke="#5AB8FF" strokeWidth="5" strokeLinecap="round" opacity="0.5" />
      <path d="M70 184l-8 14M210 184l8 14" {...line} />
      {/* duck */}
      <g className="animate-[sway_2.6s_ease-in-out_infinite]" style={{ transformOrigin: "232px 104px" }}>
        <path d="M216 104q-2-16 12-18 4-12 16-8 10 4 6 14 8 0 8 6 0 8-14 8h-26Q214 106 216 104Z" fill="#FFC83D" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M250 84l10 2-9 5Z" fill="#FF9248" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="243" cy="84" r="2.4" fill={INK} />
      </g>
    </svg>
  )
}

/** Empty states: a spray bottle that has nothing to spray yet. */
export function SprayBottle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 170" className={className} aria-hidden>
      <ellipse cx="80" cy="160" rx="52" ry="7" fill="#8B6CFF" opacity="0.18" />
      <g className="animate-wobble" style={{ transformOrigin: "80px 150px" }}>
        <path d="M58 56h44l8 22v66q0 12-12 12H62q-12 0-12-12V78Z" fill="#5AB8FF" {...line} />
        <path d="M60 92h40v34H60z" fill="#fff" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M70 104h20M70 114h14" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <path d="M62 56V40h28l22 6v8H96v2" fill="#FF6FAE" {...line} />
        <path d="M92 44l-6 22" {...line} />
        <path d="M118 40l12-6M120 50h14M118 60l12 6" stroke={INK} strokeWidth="3.5" strokeLinecap="round" className="animate-pulse" />
      </g>
    </svg>
  )
}

/** Link replaced or house not found: a puzzled housemate holding a key. */
export function LostKey({ className, color = "grape" }: { className?: string; color?: ColorKey }) {
  return (
    <svg viewBox="0 0 200 180" className={className} aria-hidden>
      <ellipse cx="100" cy="170" rx="62" ry="8" fill="#8B6CFF" opacity="0.18" />
      <g transform="translate(46 56) scale(1.08)">
        <BlobFigure color={color} shape={3} mood="wow" />
      </g>
      <g className="animate-[sway_2.2s_ease-in-out_infinite]" style={{ transformOrigin: "150px 120px" }}>
        <circle cx="160" cy="104" r="14" fill="#FFC83D" {...line} />
        <circle cx="160" cy="104" r="5" fill="#fff" stroke={INK} strokeWidth="3" />
        <path d="M150 114l-22 22m8-8l6 6m-12 0l5 5" {...line} />
      </g>
      <g>
        <rect x="20" y="10" width="64" height="44" rx="22" fill="#fff" {...line} />
        <text x="52" y="42" textAnchor="middle" fontFamily="var(--font-heading)" fontWeight="800" fontSize="26" fill={INK}>
          ?!
        </text>
      </g>
    </svg>
  )
}

/** Logo mark: three overlapping soap bubbles. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden>
      <circle cx="18" cy="28" r="13" fill="#FFC83D" stroke={INK} strokeWidth="3.5" />
      <circle cx="32" cy="20" r="11" fill="#FF6FAE" stroke={INK} strokeWidth="3.5" />
      <circle cx="33" cy="36" r="7" fill="#2ED3A1" stroke={INK} strokeWidth="3.5" />
      <path d="M11 24a8 8 0 0 1 5-5M27 15a6 6 0 0 1 4-3" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
