"use client";

import Link from "next/link";
import { Globe, LogOut, Settings, ChevronDown } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function ProfileMenu({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg hover:bg-secondary transition-colors"
          />
        }
      >
        <Avatar name={name} size="sm" />
        <ChevronDown
          className="size-3 text-muted-foreground/60"
          strokeWidth={2}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-60">
        <div className="px-2.5 py-2.5 flex items-center gap-2.5">
          <Avatar name={name} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {name}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <Link href="/settings" className="flex items-center gap-2 w-full" />
          }
        >
          <Settings
            className="size-3.5 text-muted-foreground"
            strokeWidth={1.75}
          />
          Podešavanja
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <Link href="/profile" className="flex items-center gap-2 w-full" />
          }
        >
          <Globe
            className="size-3.5 text-muted-foreground"
            strokeWidth={1.75}
          />
          Javni profil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem
            render={
              <button
                type="submit"
                className="flex items-center gap-2 w-full text-destructive"
              />
            }
          >
            <LogOut className="size-3.5" strokeWidth={1.75} />
            Odjavi se
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
