"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Countdown } from "@/components/ui/Countdown";

/* ─── Animation helpers ─── */

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 14, delay: i * 0.12 },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

/* ─── Mock data ─── */

// Use fixed future dates to avoid SSR/client hydration mismatch from Date.now()
function getMockRaffles() {
  const now = Date.now();
  return [
    {
      id: "1",
      title: "Avalanche Summit Pass",
      mode: "Roulette Wheel",
      modeBadge: "success" as const,
      participants: 47,
      maxParticipants: 100,
      prize: "2.5 AVAX",
      endsAt: now + 1000 * 60 * 60 * 4 + 1000 * 60 * 23,
    },
    {
      id: "2",
      title: "Rare NFT Giveaway",
      mode: "Duck Race",
      modeBadge: "warning" as const,
      participants: 128,
      maxParticipants: 200,
      prize: "1 Chill Penguin NFT",
      endsAt: now + 1000 * 60 * 60 * 18 + 1000 * 60 * 5,
    },
    {
      id: "3",
      title: "Community AVAX Pool",
      mode: "Roulette Wheel",
      modeBadge: "success" as const,
      participants: 312,
      maxParticipants: 500,
      prize: "10 AVAX",
      endsAt: now + 1000 * 60 * 60 * 48,
    },
  ];
}

/* ─── Inline SVGs ─── */

function HeroBanner() {
  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96">
      {/* Mint glow behind the image */}
      <div className="absolute inset-0 rounded-3xl bg-mint/10 blur-[60px] scale-110" />

      {/* The banner image with 1930s vintage effects */}
      <div className="relative w-full h-full rounded-3xl overflow-hidden border-2 border-gray-700 shadow-[0_0_40px_rgba(83,227,195,0.15)]">
        <Image
          src="/images/raffero-banner.png"
          alt="Raffero — Duck mascot spinning a roulette wheel"
          fill
          priority
          className="object-cover sepia-[0.3] contrast-[1.1] brightness-[0.85]"
          sizes="(max-width: 768px) 288px, 384px"
        />

        {/* Vignette overlay — dark edges like old film */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(4,4,4,0.7) 100%)",
          }}
        />

        {/* Scanline effect on the image */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08]"
          style={{
            background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)",
          }}
        />

        {/* Subtle mint tint overlay */}
        <div className="absolute inset-0 pointer-events-none bg-mint/[0.06] mix-blend-overlay" />

        {/* Scratches / noise for aged look */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.15]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
          }}
        />
      </div>
    </div>
  );
}

function StepIcon({ step }: { step: 1 | 2 | 3 }) {
  if (step === 1) {
    // Mask / Alias icon
    return (
      <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="38" stroke="#53e3c3" strokeWidth="2" fill="none" />
        <path
          d="M20 35 Q28 24 40 28 Q52 24 60 35 L58 42 Q52 48 40 46 Q28 48 22 42 Z"
          fill="#1a1a1a"
          stroke="#53e3c3"
          strokeWidth="2"
        />
        <circle cx="32" cy="35" r="5" fill="#f5f0e1" />
        <circle cx="48" cy="35" r="5" fill="#f5f0e1" />
        <circle cx="32" cy="35" r="2" fill="#040404" />
        <circle cx="48" cy="35" r="2" fill="#040404" />
        <text x="40" y="62" textAnchor="middle" fill="#53e3c3" fontSize="10" fontWeight="bold" fontFamily="sans-serif">?</text>
      </svg>
    );
  }
  if (step === 2) {
    // Ticket icon
    return (
      <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="38" stroke="#53e3c3" strokeWidth="2" fill="none" />
        <rect x="20" y="26" width="40" height="28" rx="6" fill="#1a1a1a" stroke="#53e3c3" strokeWidth="2" />
        <line x1="38" y1="26" x2="38" y2="54" stroke="#53e3c3" strokeWidth="1.5" strokeDasharray="3 3" />
        <text x="29" y="44" textAnchor="middle" fill="#f5f0e1" fontSize="12" fontWeight="bold" fontFamily="sans-serif">R</text>
        <circle cx="50" cy="40" r="6" fill="none" stroke="#53e3c3" strokeWidth="1.5" />
        <path d="M48 38 L53 40 L48 42" fill="#53e3c3" />
      </svg>
    );
  }
  // Show / Watch icon
  return (
    <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="38" stroke="#53e3c3" strokeWidth="2" fill="none" />
      <circle cx="40" cy="40" r="18" fill="#1a1a1a" stroke="#53e3c3" strokeWidth="2" />
      <path d="M40 22 L40 26" stroke="#53e3c3" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 54 L40 58" stroke="#53e3c3" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 40 L26 40" stroke="#53e3c3" strokeWidth="2" strokeLinecap="round" />
      <path d="M54 40 L58 40" stroke="#53e3c3" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="40" r="3" fill="#53e3c3" />
      <path d="M40 40 L40 30" stroke="#f5f0e1" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 40 L48 40" stroke="#53e3c3" strokeWidth="1.5" strokeLinecap="round" />
      {/* Confetti bursts */}
      <path d="M18 18 L22 22" stroke="#f5f0e1" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M62 18 L58 22" stroke="#53e3c3" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 50 L20 48" stroke="#53e3c3" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M60 52 L64 54" stroke="#f5f0e1" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="28" width="36" height="26" rx="6" fill="#1a1a1a" stroke="#53e3c3" strokeWidth="2.5" />
      <path
        d="M22 28 V22 Q22 12 32 12 Q42 12 42 22 V28"
        stroke="#53e3c3"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="32" cy="40" r="4" fill="#53e3c3" />
      <path d="M32 44 L32 49" stroke="#53e3c3" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Page ─── */

export default function Home() {
  const [mockRaffles] = useState(getMockRaffles);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ━━━ HERO ━━━ */}
      <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-mint/5 blur-[120px] pointer-events-none" />

        <motion.div
          className="relative z-10 flex flex-col items-center text-center gap-8"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Mascot */}
          <motion.div
            variants={fadeUp}
            custom={0}
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
            }}
          >
            <HeroBanner />
          </motion.div>

          {/* Tagline */}
          <motion.h1
            variants={fadeUp}
            custom={1}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-cream leading-tight tracking-wide"
          >
            Private Raffles.
            <br />
            <span className="text-mint">Public Fun.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="max-w-lg text-lg text-gray-300 font-body"
          >
            Zero-knowledge raffles on Avalanche. Pick an alias, join a raffle, and watch the magic
            unfold — your identity stays yours.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row gap-4 mt-2"
          >
            <Link
              href="/raffles"
              className="glow-pulse inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-2xl bg-mint text-bg-primary hover:bg-mint-hover active:bg-mint-active transition-colors duration-150 btn-squash"
            >
              Enter a Raffle
            </Link>
            <Link
              href="/create"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-2xl border border-gray-700 text-cream hover:border-gray-500 hover:bg-white/5 transition-colors duration-150 btn-squash"
            >
              Create One
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#666666"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </motion.div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="font-heading text-3xl sm:text-4xl text-cream text-center mb-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
          >
            How It Works
          </motion.h2>
          <motion.p
            className="text-gray-500 text-center mb-16 text-lg"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={1}
          >
            Three steps. Zero trace.
          </motion.p>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            {[
              {
                step: 1 as const,
                title: "Pick an Alias",
                desc: "Choose any name you like. A ZK proof ties it to your wallet without revealing who you are.",
              },
              {
                step: 2 as const,
                title: "Join a Raffle",
                desc: "Browse live raffles, pay the entry fee, and you're in. Your alias is the only thing anyone sees.",
              },
              {
                step: 3 as const,
                title: "Watch the Show",
                desc: "Roulette wheels, duck races, confetti. Winners are chosen on-chain with verifiable randomness.",
              },
            ].map(({ step, title, desc }) => (
              <motion.div key={step} variants={fadeUp} custom={step}>
                <Card hover className="p-8 flex flex-col items-center text-center gap-5 h-full">
                  <div className="relative">
                    <StepIcon step={step} />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-mint text-bg-primary text-sm font-bold flex items-center justify-center font-heading">
                      {step}
                    </span>
                  </div>
                  <h3 className="font-heading text-xl text-cream">{title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ━━━ LIVE RAFFLES PREVIEW ━━━ */}
      <section className="relative py-24 px-6 bg-bg-surface">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="font-heading text-3xl sm:text-4xl text-cream text-center mb-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
          >
            Live Raffles
          </motion.h2>
          <motion.p
            className="text-gray-500 text-center mb-16 text-lg"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={1}
          >
            Jump in before time runs out.
          </motion.p>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            {mockRaffles.map((raffle, i) => (
              <motion.div key={raffle.id} variants={fadeUp} custom={i}>
                <Card hover className="p-6 flex flex-col gap-5 h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-heading text-lg text-cream leading-snug">
                      {raffle.title}
                    </h3>
                    <Badge variant={raffle.modeBadge}>{raffle.mode}</Badge>
                  </div>

                  {/* Countdown */}
                  <div className="flex justify-center">
                    <Countdown targetDate={raffle.endsAt} className="scale-[0.7] origin-center" />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm border-t border-gray-800 pt-4">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs uppercase tracking-wider">
                        Players
                      </span>
                      <span className="text-cream font-heading">
                        {raffle.participants}
                        <span className="text-gray-500">/{raffle.maxParticipants}</span>
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-gray-500 text-xs uppercase tracking-wider">Prize</span>
                      <span className="text-mint font-heading font-semibold">{raffle.prize}</span>
                    </div>
                  </div>

                  {/* Capacity bar */}
                  <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-mint/60"
                      style={{
                        width: `${(raffle.participants / raffle.maxParticipants) * 100}%`,
                      }}
                    />
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* View all link */}
          <motion.div
            className="flex justify-center mt-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <Link
              href="/raffles"
              className="text-mint hover:text-mint-hover transition-colors font-heading text-lg underline underline-offset-4 decoration-mint/30 hover:decoration-mint/60"
            >
              View all raffles
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ━━━ PRIVACY PROMISE ━━━ */}
      <section className="relative py-24 px-6">
        <motion.div
          className="max-w-3xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <Card className="p-10 sm:p-14 flex flex-col items-center text-center gap-6 border-mint/20">
            <motion.div variants={fadeUp} custom={0}>
              <LockIcon />
            </motion.div>

            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-heading text-3xl sm:text-4xl text-cream"
            >
              Your Alias Is Yours
            </motion.h2>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-gray-300 text-lg leading-relaxed max-w-xl"
            >
              Raffero uses zero-knowledge proofs to verify you're eligible without revealing your
              wallet address. Nobody — not even the raffle creator — can link your alias back to you.
            </motion.p>

            <motion.p
              variants={fadeUp}
              custom={3}
              className="text-gray-500 text-sm"
            >
              Powered by ZK-SNARKs on Avalanche C-Chain
            </motion.p>
          </Card>
        </motion.div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-gray-800 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-xl text-mint tracking-wide">Raffero</span>
          <p className="text-gray-500 text-sm">
            Private raffles on Avalanche. Built with ZK proofs.
          </p>
        </div>
      </footer>
    </div>
  );
}
