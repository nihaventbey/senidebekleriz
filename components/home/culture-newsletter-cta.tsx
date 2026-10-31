import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Sparkles, Calendar, Ticket } from "lucide-react";

export function CultureNewsletterCta() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-muted/40 p-8 sm:p-12 md:p-16 text-center">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Kültür ve Sanat Ajandası</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">
            Hafta Sonu Planını Son Güne Bırakma
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Şehrindeki en yeni tiyatro oyunları, konserler, müze sergileri ve kaçırılmayacak festivaller her an yayında. Kültür takvimini yakından takip et!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Button size="lg" asChild className="font-bold shadow-md">
              <Link href="/etkinlikler?zaman=haftasonu">
                <Calendar className="mr-2 h-4 w-4" />
                Bu Hafta Sonu Ne Var?
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="font-semibold">
              <Link href="/haberler">
                📰 Güncel Kültür Haberleri
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
