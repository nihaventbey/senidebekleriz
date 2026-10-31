import Link from "next/link";
import type { BrandSettings } from "@/lib/settings/branding";

type LogoProps = {
  className?: string;
  brand?: Pick<BrandSettings, "logoUrl">;
};

function DefaultLogoMark() {
  return (
    <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M16 2V6M8 2V6M4 10H20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="15" r="1.5" fill="currentColor" />
      </svg>
    </div>
  );
}

export function Logo({ className = "", brand }: LogoProps) {
  const hasCustomLogo = Boolean(brand?.logoUrl);

  return (
    <Link href="/" className={`group flex items-center gap-2.5 ${className}`}>
      {hasCustomLogo ? (
        <img
          src={brand!.logoUrl!}
          alt="Seni de Bekleriz"
          className="h-10 sm:h-11 w-auto max-w-[240px] sm:max-w-[320px] object-contain object-left transition-transform group-hover:scale-[1.02]"
        />
      ) : (
        <>
          <DefaultLogoMark />
          <div className="flex flex-col leading-none">
            <span className="text-base font-extrabold tracking-tight text-foreground">
              Seni de Bekleriz
            </span>
            <span className="text-[10px] font-semibold tracking-wide text-primary/80 uppercase pt-0.5">
              Kültür, Sanat &amp; Ajanda
            </span>
          </div>
        </>
      )}
    </Link>
  );
}
