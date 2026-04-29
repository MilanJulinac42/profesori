"use client";

import { useEffect, useState } from "react";
import { Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

/** Strip non-digits, optionally drop leading +. */
function digits(input: string): string {
  return input.replace(/[^\d]/g, "");
}

/** Normalize a Serbian phone for international format: 0XX -> 381XX. */
function intlDigits(input: string): string {
  const d = digits(input);
  if (d.startsWith("0")) return "381" + d.slice(1);
  return d;
}

/**
 * Floating right-side dock with quick contact buttons (WhatsApp, Viber, phone, email).
 * Appears after scrolling past the hero. Hidden on mobile to avoid colliding
 * with StickyCta and small screen real estate.
 */
export function QuickContactDock({
  phone,
  email,
}: {
  phone: string | null;
  email: string | null;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!phone && !email) return null;

  const intl = phone ? intlDigits(phone) : null;
  const tel = phone ? phone.replace(/[^+\d]/g, "") : null;

  return (
    <div
      className={cn(
        "hidden md:flex fixed top-1/2 right-4 -translate-y-1/2 z-30",
        "flex-col gap-2.5 transition-all duration-200",
        show
          ? "translate-x-0 opacity-100"
          : "translate-x-12 opacity-0 pointer-events-none",
      )}
    >
      {intl && (
        <DockButton
          href={`https://wa.me/${intl}`}
          target="_blank"
          label="WhatsApp"
          color="bg-[#25D366]"
        >
          <WhatsAppIcon className="size-5" />
        </DockButton>
      )}
      {phone && (
        <DockButton
          href={`viber://chat?number=${encodeURIComponent("+" + intl)}`}
          label="Viber"
          color="bg-[#7360F2]"
        >
          <ViberIcon className="size-5" />
        </DockButton>
      )}
      {tel && (
        <DockButton
          href={`tel:${tel}`}
          label="Pozovi"
          color="bg-foreground text-background"
        >
          <Phone className="size-5" strokeWidth={2} />
        </DockButton>
      )}
      {email && (
        <DockButton
          href={`mailto:${email}`}
          label="Email"
          color="bg-foreground text-background"
        >
          <Mail className="size-5" strokeWidth={2} />
        </DockButton>
      )}
    </div>
  );
}

function DockButton({
  href,
  target,
  label,
  color,
  children,
}: {
  href: string;
  target?: string;
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      aria-label={label}
      title={label}
      className={cn(
        "group relative flex size-11 items-center justify-center rounded-full text-white shadow-lg",
        "transition-all duration-200 hover:scale-110 hover:shadow-xl",
        color,
      )}
    >
      {children}
      <span className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-foreground text-background text-xs font-medium px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
    </a>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function ViberIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M11.398.002C9.473.028 5.331.344 3.014 2.467 1.293 4.177.69 6.7.625 9.825c-.06 3.116-.139 8.954 5.495 10.541h.006l-.004 2.42s-.037.978.61 1.179c.787.244 1.246-.506 1.997-1.314.412-.443.98-1.097 1.41-1.591 3.85.324 6.812-.418 7.151-.528.78-.255 5.193-.819 5.91-6.683.74-6.044-.36-9.864-2.34-11.586l-.013-.005c-.6-.55-3.005-2.3-8.375-2.32 0 0-.395-.026-1.074-.025zm.066 1.76c.575-.003.91.018.91.018 4.54.013 6.717 1.38 7.226 1.84 1.674 1.435 2.535 4.876 1.908 9.917-.61 4.892-4.05 5.205-4.71 5.42-.286.09-2.835.74-6.038.531 0 0-2.387 2.881-3.133 3.62-.116.117-.253.16-.345.135-.13-.034-.166-.187-.166-.41l.025-4.026c-4.766-1.323-4.488-6.292-4.438-8.894.064-2.602.563-4.733 2.018-6.165 1.96-1.78 5.477-2.05 7.115-2.066 0 0 .136-.013.628-.018zm.677 2.834a.477.477 0 0 0 0 .953c1.622.018 2.95.557 4.034 1.626 1.084 1.069 1.626 2.456 1.654 4.183a.477.477 0 0 0 .953-.014c-.03-1.957-.65-3.583-1.939-4.85-1.288-1.27-2.92-1.916-4.7-1.92zM7.6 5.61a.708.708 0 0 0-.43.158 4.49 4.49 0 0 0-1.06 1.045c-.286.405-.49.81-.543 1.222-.054.412-.014.834.187 1.262.6 1.282 1.348 2.52 2.347 3.732 1 1.213 2.214 2.395 3.638 3.512 1.013.793 1.992 1.295 2.85 1.4.412.05.836-.014 1.261-.245.426-.231.83-.598 1.162-1.03a4.5 4.5 0 0 0 .49-.745c.103-.196.171-.388.166-.567a.704.704 0 0 0-.213-.494c-.218-.222-.44-.413-.665-.587a14.61 14.61 0 0 0-.728-.524c-.255-.176-.487-.318-.692-.42-.205-.103-.379-.158-.527-.158a.738.738 0 0 0-.5.21c-.151.131-.3.305-.439.494a3.78 3.78 0 0 0-.366.617c-.107.221-.196.413-.27.561-.073.149-.11.225-.11.225s-.078.014-.198-.025a3.7 3.7 0 0 1-.397-.157 4.74 4.74 0 0 1-.524-.296 7.34 7.34 0 0 1-.604-.461c-.213-.176-.422-.385-.628-.604a7.376 7.376 0 0 1-.461-.604 4.748 4.748 0 0 1-.296-.524 3.7 3.7 0 0 1-.157-.397c-.039-.12-.025-.198-.025-.198s.077-.037.225-.11c.149-.074.34-.163.561-.27.222-.107.428-.23.617-.366.189-.139.363-.288.494-.439a.738.738 0 0 0 .21-.5c0-.149-.055-.323-.158-.527-.103-.205-.244-.437-.42-.692-.176-.255-.353-.499-.524-.728a14.61 14.61 0 0 0-.587-.665.704.704 0 0 0-.494-.213zm5.092 1.024a.477.477 0 0 0 0 .953c.943.013 1.71.34 2.346.99.636.65.974 1.48.99 2.534a.477.477 0 0 0 .953-.014c-.018-1.288-.466-2.395-1.262-3.205-.795-.81-1.886-1.244-3.027-1.258zm.04 1.81a.477.477 0 0 0-.072.95c.286.051.49.158.658.327.169.168.276.376.328.673a.477.477 0 1 0 .94-.166c-.073-.418-.252-.797-.594-1.142a1.95 1.95 0 0 0-1.16-.638.477.477 0 0 0-.099-.005z" />
    </svg>
  );
}
