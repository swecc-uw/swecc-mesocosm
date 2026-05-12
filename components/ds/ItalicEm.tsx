import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function ItalicEm({ children }: Props) {
  return (
    <em className="italic font-medium text-leaf-deep [font-family:var(--f-display)]">
      {children}
    </em>
  );
}
