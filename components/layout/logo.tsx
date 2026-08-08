import Link from "next/link";
import type { BrandSettings } from "@/lib/settings/branding";

type LogoProps = {
  className?: string;
  brand?: Pick<BrandSettings, "logoUrl">;
};

function DefaultLogoMark() {
  return (
    <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary transition-transform group-hover:scale-105">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M12 22S4 14.5 4 9.5C4 5.36 7.58 2 12 2C16.42 2 20 5.36 20 9.5C20 14.5 12 22 12 22Z"
          stroke="white"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="9.5" r="3" fill="white" />
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
            <span className="text-base font-extrabold tracking-tight">
              Seni de Bekleriz
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              Türkiye Şehir Rehberi
            </span>
          </div>
        </>
      )}
    </Link>
  );
}
