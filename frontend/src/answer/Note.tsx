import type { ReactNode } from "react";

export function Note({ children }: { children: ReactNode }) {
  return <p className="m-0 rounded-md bg-surface-container p-3 body-md">{children}</p>;
}
