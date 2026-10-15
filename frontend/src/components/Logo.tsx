/** AuraSpot brand mark: house inside a compass ring. */
export const Logo = ({ size = 26 }: { size?: number }) => (
  <svg className="logo-icon" width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.2" strokeDasharray="4 2 6 2" opacity="0.85" />
    <path
      d="M16 7L7 14V24C7 24.5523 7.44772 25 8 25H13V18H19V25H24C24.5523 25 25 24.5523 25 24V14L16 7Z"
      fill="currentColor"
    />
  </svg>
);
