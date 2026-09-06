"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingOverlay } from "@/components/common/loading-overlay";
import { logout } from "@/app/actions";

function LogoutSubmit() {
  const { pending } = useFormStatus();
  return (
    <>
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        aria-label="Logout"
        disabled={pending}
      >
        <LogOut />
      </Button>
      {pending && <LoadingOverlay label="Signing out…" />}
    </>
  );
}

export function LogoutForm() {
  return (
    <form action={logout}>
      <LogoutSubmit />
    </form>
  );
}
