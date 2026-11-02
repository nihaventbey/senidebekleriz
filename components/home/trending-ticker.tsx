import Link from "next/link";
import { Flame, Sparkles, TrendingUp } from "lucide-react";

const TRENDING_TOPICS = [
  { label: "Kültür Yolu Festivalleri", href: "/haberler?q=kultur-yolu", badge: "Festival" },
  { label: "1914 Kuşağı Başyapıtları", href: "/etkinlikler/sergi", badge: "Sergi" },
  { label: "Mardin Taş Konaklar Rotası", href: "/blog/mardin-gezi-rehberi-tas-konaklar-manastirlar-dara-rotasi", badge: "Rehber" },
  { label: "Hafta Sonu Tiyatro Takvimi", href: "/etkinlikler?zaman=haftasonu&tur=tiyatro", badge: "Sahne" },
  { label: "Edirne Selimiye & Mimar Sinan", href: "/blog/edirne-gezi-rehberi-selimiye-meric-koprusu-tava-ciger", badge: "Tarih" },
  { label: "Göbeklitepe & Urfa Arkeolojisi", href: "/blog/sanliurfa-gezi-rehberi-gobeklitepe-balikligol-harran-rotasi", badge: "Keşif" },
];

export function TrendingTicker() {
  return (
    <div className="border-b border-border/50 bg-muted/30 py-2 sm:py-2.5">
      <div className="container mx-auto px-4 flex items-center gap-3 overflow-x-auto no-scrollbar text-xs">
        <div className="flex items-center gap-1.5 shrink-0 font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full text-[11px]">
          <Flame className="h-3.5 w-3.5 fill-rose-500 animate-pulse" />
          <span>Gündem</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {TRENDING_TOPICS.map((topic, i) => (
            <Link
              key={topic.label}
              href={topic.href}
              className="group flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-muted-foreground transition-all hover:bg-background hover:text-foreground hover:shadow-xs border border-transparent hover:border-border/60"
            >
              <span className="text-[10px] font-semibold text-primary/70 group-hover:text-primary">
                #{topic.badge}
              </span>
              <span className="font-medium text-foreground/90 group-hover:text-primary">
                {topic.label}
              </span>
              {i < TRENDING_TOPICS.length - 1 && (
                <span className="text-muted-foreground/30 ml-2">/</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
