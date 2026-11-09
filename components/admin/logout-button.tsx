"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      Çıkış Yap
    </Button>
  );
}
