import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group flex items-center gap-2.5 ${className}`}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary transition-transform group-hover:scale-105">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
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
      <div className="flex flex-col leading-none">
        <span className="text-base font-extrabold tracking-tight">
          Seni de Bekleriz
        </span>
        <span className="text-[10px] font-medium text-muted-foreground">
          Türkiye Şehir Rehberi
        </span>
      </div>
    </Link>
  );
}
