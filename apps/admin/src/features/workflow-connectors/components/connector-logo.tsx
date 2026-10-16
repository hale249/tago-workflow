import type { ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon, UserIcon } from "@hugeicons/core-free-icons"

/*
 * Brand marks for the connector catalog (the reference shows full-colour service logos at 32px).
 * Drawn inline so the app ships no third-party image assets; types without a mark fall back to the tinted glyph tile.
 */
const Svg = ({ children }: { children: ReactNode }) => <svg viewBox="0 0 32 32" className="size-8" aria-hidden>{children}</svg>

const FACEBOOK = (
  <Svg>
    <circle cx="16" cy="16" r="15" fill="#0866FF" />
    <path fill="#fff" d="M18.2 31v-10.6h3.4l.6-4h-4v-2.6c0-1.1.4-1.9 2-1.9h2.1V8.4c-.4-.1-1.6-.2-3-.2-3 0-5.1 1.8-5.1 5.2v3h-3.4v4h3.4V31z" />
  </Svg>
)

const glyph = (bg: string, icon: typeof Mail01Icon) => (
  <span className="flex size-8 items-center justify-center rounded-full" style={{ background: bg }}>
    <HugeiconsIcon icon={icon} className="size-4.5 text-white" strokeWidth={2} />
  </span>
)

const MARKS: Record<string, ReactNode> = {
  SMTP: glyph("#2F6FDB", Mail01Icon),
  FACEBOOK_LOGIN: FACEBOOK,
  FACEBOOK_PAGE: FACEBOOK,
  FACEBOOK_PAGE_MESSAGING: FACEBOOK,
  FACEBOOK_ADS: FACEBOOK,
  FACEBOOK_INSIGHTS_ANALYTICS: FACEBOOK,
  WHATSAPP_CHAT: (
    <Svg>
      <path fill="#25D366" d="M16 2.5a13.5 13.5 0 0 0-11.6 20.4L2.6 29.4l6.7-1.7A13.5 13.5 0 1 0 16 2.5z" />
      <path fill="#fff" d="M11.6 9.3c-.3-.6-.6-.6-.9-.6h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.4s1.5 4 1.7 4.2c.2.3 2.9 4.6 7.1 6.3 3.5 1.4 4.2 1.1 5 1 .8-.1 2.4-1 2.8-2 .3-1 .3-1.8.2-2-.1-.2-.4-.3-.8-.5s-2.4-1.2-2.8-1.3c-.4-.1-.6-.2-.9.2-.3.4-1.1 1.3-1.3 1.6-.2.3-.5.3-.9.1-.4-.2-1.7-.6-3.2-2-1.2-1.1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.3.1-.5 0-.7l-1.7-3.2z" />
    </Svg>
  ),
  INSTAGRAM_CHAT: (
    <Svg>
      <defs>
        <linearGradient id="cl-ig" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset=".35" stopColor="#FA7E1E" />
          <stop offset=".6" stopColor="#D62976" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#cl-ig)" />
      <rect x="7.5" y="7.5" width="17" height="17" rx="5" fill="none" stroke="#fff" strokeWidth="2.2" />
      <circle cx="16" cy="16" r="4" fill="none" stroke="#fff" strokeWidth="2.2" />
      <circle cx="21.3" cy="10.7" r="1.3" fill="#fff" />
    </Svg>
  ),
  GOOGLE_PHOTOS: (
    <Svg>
      <path fill="#FBBC04" d="M16 16V4.5a6 6 0 0 0-6 6V16z" />
      <path fill="#EA4335" d="M16 16h11.5a6 6 0 0 0-6-6H16z" />
      <path fill="#4285F4" d="M16 16v11.5a6 6 0 0 0 6-6V16z" />
      <path fill="#34A853" d="M16 16H4.5a6 6 0 0 0 6 6H16z" />
    </Svg>
  ),
  GOOGLE_TASKS: (
    <Svg>
      <circle cx="16" cy="16" r="12" fill="none" stroke="#1E88E5" strokeWidth="3.5" />
      <path d="m10.5 16 4 4 11-11" fill="none" stroke="#1E88E5" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  GOOGLE_CONTACTS: glyph("#1A73E8", UserIcon),
  GOOGLE_CALENDAR: (
    <Svg>
      <rect x="3" y="3" width="26" height="26" rx="3" fill="#4285F4" />
      <rect x="7" y="9" width="18" height="16" rx="1" fill="#fff" />
      <text x="16" y="22.5" textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="Arial, sans-serif" fill="#1A73E8">31</text>
      <path fill="#34A853" d="M3 23h6v6H6a3 3 0 0 1-3-3z" />
      <path fill="#EA4335" d="M23 23h6l-6 6z" />
    </Svg>
  ),
  GOOGLE_GMAIL: (
    <Svg>
      <path fill="#4285F4" d="M3 11.5V25a2 2 0 0 0 2 2h4V15.9z" />
      <path fill="#34A853" d="M23 15.9V27h4a2 2 0 0 0 2-2V11.5z" />
      <path fill="#EA4335" d="M3 8.5c0-1.6 1.8-2.5 3-1.6L16 14l10-7.1c1.2-.9 3 0 3 1.6v3L16 21 3 11.5z" />
      <path fill="#FBBC04" d="M23 10.3 26 8c1.2-.9 3 0 3 1.6v1.9l-6 4.4z" />
      <path fill="#C5221F" d="M9 10.3 6 8c-1.2-.9-3 0-3 1.6v1.9l6 4.4z" />
    </Svg>
  ),
  GOOGLE_DRIVE: (
    <Svg>
      <path fill="#FFBA00" d="M11 4h10l9 16H20z" />
      <path fill="#00AC47" d="M11 4l5 8.5L7 28l-5-8z" />
      <path fill="#2684FC" d="M11.5 20H30l-5 8H7z" />
    </Svg>
  ),
  GOOGLE_SHEETS: (
    <Svg>
      <path fill="#0F9D58" d="M19 2H8a2.5 2.5 0 0 0-2.5 2.5v23A2.5 2.5 0 0 0 8 30h16a2.5 2.5 0 0 0 2.5-2.5V9.5z" />
      <path fill="#87CEAC" d="M19 2v5a2.5 2.5 0 0 0 2.5 2.5h5z" />
      <path fill="#fff" d="M10 14h12v9H10zm1.5 1.5v2h3.8v-2zm5.2 0v2h3.8v-2zm-5.2 3.5v2.5h3.8V19zm5.2 0v2.5h3.8V19z" />
    </Svg>
  ),
  ZALO_OA: (
    <Svg>
      <path fill="none" stroke="#0068FF" strokeWidth="1.6" d="M16 3.5C8.8 3.5 3 8.6 3 15c0 3.4 1.6 6.4 4.2 8.5L6 28.5l5.4-2.6c1.4.4 3 .6 4.6.6 7.2 0 13-5.1 13-11.5S23.2 3.5 16 3.5z" />
      <text x="16" y="18.6" textAnchor="middle" fontSize="8.4" fontWeight="700" fontStyle="italic" fontFamily="Arial, sans-serif" fill="#0068FF">Zalo</text>
    </Svg>
  ),
  KIOTVIET: (
    <Svg>
      <path fill="#E53935" d="M16 5.5 28.5 27h-25z" />
      <path fill="#fff" d="M14.8 12.5h2.4l-.3 8h-1.8zm1.2 9.6a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8z" />
    </Svg>
  ),
  HARAVAN: (
    <Svg>
      <circle cx="5.5" cy="16" r="2.5" fill="#1E4FB8" />
      <text x="9" y="17.6" fontSize="5" fontWeight="600" fontFamily="Arial, sans-serif" fill="#1E4FB8">haravan</text>
    </Svg>
  ),
  VIETTEL_POST: (
    <Svg>
      <text x="16" y="17.5" textAnchor="middle" fontSize="7.4" fontWeight="700" fontFamily="Arial, sans-serif" fill="#EE0033">viettel</text>
      <text x="27" y="21.5" textAnchor="end" fontSize="3" fontFamily="Arial, sans-serif" fill="#EE0033">post</text>
    </Svg>
  ),
  EMS: (
    <Svg>
      <path fill="#F7941D" d="M5 13.5h7l-1 1.4H4z" />
      <text x="17.5" y="18" textAnchor="middle" fontSize="6.4" fontWeight="800" fontStyle="italic" fontFamily="Arial, sans-serif" fill="#1D4E9E">EMS</text>
    </Svg>
  ),
}

/** Full-colour brand mark of a connector type, or `fallback` when the catalog has none. */
export function ConnectorLogo({ type, fallback }: { type: string; fallback: ReactNode }) {
  const mark = MARKS[type]
  return mark ? <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md">{mark}</span> : <>{fallback}</>
}

