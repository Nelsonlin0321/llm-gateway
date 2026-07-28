"use client";

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

type ReactHotToastProviderProps = {
  children: ReactNode;
};

export function ReactHotToastProvider({
  children,
}: ReactHotToastProviderProps) {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3200,
          style: {
            background: "#080d0f",
            color: "#fcfcfe",
            border: "1px solid rgba(252, 252, 254, 0.14)",
            borderRadius: "8px",
            fontSize: "14px",
            fontFamily:
              "var(--font-body), ui-sans-serif, system-ui, sans-serif",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
          },
          success: {
            iconTheme: {
              primary: "#00bf6f",
              secondary: "#080d0f",
            },
          },
          error: {
            iconTheme: {
              primary: "#ff2d55",
              secondary: "#080d0f",
            },
          },
        }}
      />
    </>
  );
}

export default ReactHotToastProvider;
