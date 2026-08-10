import { useState } from 'react'

const baseInput =
  'w-full rounded-md border border-border bg-white py-2.5 text-sm text-ink placeholder:text-muted/60 ' +
  'outline-none transition focus:border-signal focus:ring-4 focus:ring-signal/10'

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.75" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.5 5.5 10 10.75l6.5-5.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
      <rect x="4" y="8.75" width="12" height="8" rx="1.75" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6.5 8.75V6.5a3.5 3.5 0 0 1 7 0v2.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.75 16c.9-3 3.35-4.75 6.25-4.75S15.35 13 16.25 16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export const fieldIcons = { mail: MailIcon, lock: LockIcon, user: UserIcon }

export function FormField({ label, id, icon, ...props }) {
  const Icon = icon && fieldIcons[icon]
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-medium tracking-tight text-ink"
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-muted">
            <Icon />
          </span>
        )}
        <input
          id={id}
          className={baseInput + (Icon ? ' pl-10 pr-3.5' : ' px-3.5')}
          {...props}
        />
      </div>
    </div>
  )
}

function EyeIcon({ off }) {
  return off ? (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
      <path
        d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
      <path
        d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

export function PasswordField({ label, id, value, onChange, ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-medium tracking-tight text-ink"
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-muted">
          <LockIcon />
        </span>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className={baseInput + ' pl-10 pr-11'}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted transition hover:text-ink"
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          <EyeIcon off={!visible} />
        </button>
      </div>
    </div>
  )
}