import Image from 'next/image';

/** The HarithKavish Auth mark, shared by the handoff strip and the favicon. */
export function BrandMark({ className = 'handoff__mark' }: { className?: string }) {
  return (
    <Image
      className={className}
      src="/hk-auth-logo.svg"
      alt="HarithKavish"
      width={64}
      height={64}
      priority
    />
  );
}
