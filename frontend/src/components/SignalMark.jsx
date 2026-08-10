export default function SignalMark({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="18" width="5" height="10" rx="1.5" fill="#4640DE" />
      <rect x="13.5" y="10" width="5" height="18" rx="1.5" fill="#4640DE" />
      <rect x="23" y="4" width="5" height="24" rx="1.5" fill="#0F9B6E" />
    </svg>
  )
}
