import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-medium text-[15px] tracking-tight">profesori</span>
    </Link>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-foreground", className)}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="6" fill="currentColor" />
      <path
        d="M7 9.5L12 7L17 9.5L12 12L7 9.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        className="text-background"
        fill="none"
      />
      <path
        d="M9 11.5V14C9 14 10.3 15.5 12 15.5C13.7 15.5 15 14 15 14V11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-background"
      />
    </svg>
  );
}
