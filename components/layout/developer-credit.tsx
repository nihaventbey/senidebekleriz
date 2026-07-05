import Image from "next/image";

export function DeveloperCredit() {
  return (
    <a
      href="https://www.baskabidunya.com"
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2 opacity-65 transition-all duration-300 hover:opacity-100"
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        geliştirici
      </span>
      <Image
        src="/logos/baskabidunya-dark-logo.png"
        alt="Başka bi'Dünya"
        width={120}
        height={20}
        className="h-5 w-auto object-contain grayscale transition-all duration-300 group-hover:grayscale-0 dark:hidden"
      />
      <Image
        src="/logos/baskabidunya-white-logo.png"
        alt="Başka bi'Dünya"
        width={120}
        height={20}
        className="hidden h-5 w-auto object-contain grayscale transition-all duration-300 group-hover:grayscale-0 dark:block"
      />
    </a>
  );
}
