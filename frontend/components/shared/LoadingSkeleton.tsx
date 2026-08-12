"use client";

import { spacing, radius, colors } from "@/lib/design-tokens";

interface Props {
  count?: number;
  height?: string;
  width?: string;
}

export function LoadingSkeleton({ count = 3, height = "1rem", width = "60%" }: Props) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            height,
            width: typeof width === "string" && width.includes("%") ? width : width,
            background: colors.border,
            borderRadius: radius.sm,
            opacity: 0.5,
            marginBottom: spacing.sm,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </>
  );
}
