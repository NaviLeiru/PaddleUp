"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/owner/facility", label: "Facility Setup" },
  { href: "/owner/courts", label: "Courts" },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-64 shrink-0 flex-col justify-between bg-nav p-6 text-white">
        <div>
          <div className="mb-8 font-heading text-xl font-bold">PaddleUp</div>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white",
                  pathname.startsWith(item.href) && "bg-white/10 text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-md px-3 py-2 text-left text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
        >
          Sign out
        </button>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
