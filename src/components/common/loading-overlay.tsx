import { Loader2 } from "lucide-react";

/**
 * Full-screen blocking overlay with a spinner, shown while an auth action
 * (login / register / logout) is in flight and its redirect is resolving.
 */
export function LoadingOverlay({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm"
    >
      <Loader2 className="size-8 animate-spin text-primary" />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
      <span className="sr-only">Loading</span>
    </div>
  );
}
