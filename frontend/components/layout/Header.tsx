"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ConnectButton } from "@/components/wallet/ConnectButton";

const navLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/raffle/create", label: "Create" },
  { href: "/my-raffles", label: "My Raffles" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        className="transition-transform duration-300 group-hover:rotate-12"
      >
        <circle
          cx="18"
          cy="18"
          r="16"
          stroke="#53e3c3"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M12 18 C12 14, 14 12, 18 12 C22 12, 24 14, 24 18 C24 22, 22 24, 18 24"
          stroke="#53e3c3"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="18" cy="18" r="2.5" fill="#53e3c3" />
      </svg>
      <span className="font-display text-xl tracking-wide text-cream">
        RAFFERO
      </span>
    </Link>
  );
}

function MobileMenuButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 cursor-pointer"
      aria-label="Toggle menu"
    >
      <motion.span
        className="block w-6 h-0.5 bg-cream rounded-full"
        animate={open ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.span
        className="block w-6 h-0.5 bg-cream rounded-full"
        animate={open ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.15 }}
      />
      <motion.span
        className="block w-6 h-0.5 bg-cream rounded-full"
        animate={open ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.2 }}
      />
    </button>
  );
}

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-bg-primary/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  active
                    ? "text-mint"
                    : "text-gray-300 hover:text-cream hover:bg-white/5"
                )}
              >
                {link.label}
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-mint rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ConnectButton />
          <MobileMenuButton
            open={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          />
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-gray-800 bg-bg-surface"
          >
            <div className="flex flex-col px-4 py-3 gap-1">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                      active
                        ? "text-mint bg-mint-muted"
                        : "text-gray-300 hover:text-cream hover:bg-white/5"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
