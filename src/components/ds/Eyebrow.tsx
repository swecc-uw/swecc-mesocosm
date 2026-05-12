import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  leaf?: boolean;
  className?: string;
}

export function Eyebrow({ children, leaf = false, className = "" }: Props) {
  return (
    <span className={`eyebrow ${leaf ? "eyebrow-leaf" : ""} ${className}`}>
      {children}
    </span>
  );
}
