"use client";

import { useState } from "react";

import {
  builtInProviderIconUsesLightFill,
  getBuiltInProviderIconUrl,
} from "@/lib/llm-provider/icons";
import { cn } from "@/lib/utils";

type BuiltInProviderIconProps = {
  name: string;
  className?: string;
};

export function BuiltInProviderIcon({
  name,
  className,
}: BuiltInProviderIconProps) {
  const colorSrc = getBuiltInProviderIconUrl(name, "color");
  const monoSrc = getBuiltInProviderIconUrl(name, "mono");
  const [src, setSrc] = useState(colorSrc ?? monoSrc);
  const invertToWhite = builtInProviderIconUsesLightFill(name);

  if (!src) {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-flex size-4.5 shrink-0 items-center justify-center rounded-sm bg-surface-2 text-[9px] font-semibold uppercase text-text-tertiary",
          className,
        )}
      >
        {name.slice(0, 1) || "?"}
      </span>
    );
  }

  return (
    // External brand marks from Lobe Icons; sized via className, not next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={18}
      height={18}
      className={cn(
        "size-4.5 shrink-0 object-contain",
        invertToWhite && "invert",
        className,
      )}
      onError={() => {
        if (monoSrc && src !== monoSrc) {
          setSrc(monoSrc);
        }
      }}
    />
  );
}
