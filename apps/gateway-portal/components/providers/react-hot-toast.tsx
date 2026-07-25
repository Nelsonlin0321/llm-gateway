"use client"

import type { ReactNode } from "react"
import { Toaster } from "react-hot-toast"

type ReactHotToastProviderProps = {
  children: ReactNode
}

export function ReactHotToastProvider({
  children,
}: ReactHotToastProviderProps) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}

export default ReactHotToastProvider
