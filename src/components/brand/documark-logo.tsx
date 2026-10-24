import React from "react";

interface DocuMarkLogoProps {
  readonly className?: string;
}

export function DocuMarkLogo({
  className = "h-6 w-6",
}: DocuMarkLogoProps): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
    >
      <path
        d="M6 5C6 3.89543 6.89543 3 8 3H19.5L26 9.5V27C26 28.1046 25.1046 29 24 29H8C6.89543 29 6 28.1046 6 27V5Z"
        fill="var(--bg-surface)"
        stroke="var(--text-primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M19 3V8.5C19 9.05228 19.4477 9.5 20 9.5H26"
        fill="var(--bg-canvas)"
        stroke="var(--text-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 20V14L12 17L14.5 14V20"
        stroke="var(--text-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 13.5V20.5M20 20.5L17.5 18M20 20.5L22.5 18"
        stroke="var(--accent-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="9.5"
        y="23.5"
        width="13"
        height="2"
        rx="1"
        fill="var(--accent-primary)"
      />
    </svg>
  );
}

