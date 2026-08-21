interface Props {
  size?: number;
}

export function LogoMark({ size = 22 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="16" width="20" height="4" rx="2" fill="#9a1f2b" />
      <rect x="5" y="10" width="14" height="4" rx="2" fill="#9a1f2b" opacity="0.72" />
      <rect x="8" y="4" width="8" height="4" rx="2" fill="#9a1f2b" opacity="0.46" />
    </svg>
  );
}
