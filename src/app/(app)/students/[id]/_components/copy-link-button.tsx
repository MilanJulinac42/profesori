"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-background hover:bg-secondary text-xs h-7 px-2.5"
    >
      {copied ? (
        <Check className="size-3" strokeWidth={2} />
      ) : (
        <Copy className="size-3" strokeWidth={1.75} />
      )}
      {copied ? "Kopirano" : "Kopiraj link"}
    </button>
  );
}
