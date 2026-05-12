import { ReactNode, AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "link";

const BASE =
  "inline-flex items-center gap-2 rounded-full px-4 h-9 text-sm font-medium transition-colors";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink text-paper hover:bg-leaf-deep dark:bg-leaf-deep dark:text-paper dark:hover:bg-leaf",
  ghost: "border border-line text-ink hover:border-ink",
  link: "px-0 h-auto text-ink hover:text-leaf-deep underline-offset-4 hover:underline",
};

interface CommonProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

type AsLink = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
type AsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

export function Btn(props: AsLink | AsButton) {
  const { variant = "primary", className = "", children, ...rest } = props;
  const cls = `${BASE} ${VARIANTS[variant]} ${className}`;
  if ("href" in rest && rest.href !== undefined) {
    return (
      <a {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      className={cls}
    >
      {children}
    </button>
  );
}
