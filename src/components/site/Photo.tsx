/* eslint-disable @next/next/no-img-element -- images come from uploads/S3/remote URLs set in the admin */
import type { CSSProperties, ReactNode } from "react";

interface Props {
  src?: string | null;
  alt?: string;
  /** Placeholder text when there is no image */
  label?: ReactNode;
  className?: string;
  style?: CSSProperties;
  round?: boolean;
  children?: ReactNode;
}

/** Image slot with the striped placeholder from the design. */
export function Photo({ src, alt = "", label, className = "", style, round, children }: Props) {
  return (
    <div className={`ph ${round ? "round" : ""} ${className}`} style={style}>
      {src ? <img src={src} alt={alt} loading="lazy" /> : label}
      {children}
    </div>
  );
}
