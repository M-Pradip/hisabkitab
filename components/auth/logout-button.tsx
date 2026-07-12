"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function LogoutButton() {
  const router = useRouter();
  const { toast } = useToast();

  async function handleLogout() {
    await signOut({ redirect: false, callbackUrl: "/login" });
    toast({
      title: "Signed out",
      description: "You have been logged out safely.",
      variant: "success",
    });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button type="button" variant="secondary" onClick={handleLogout}>
      Logout
    </Button>
  );
}
