"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ModeSelector } from "./ModeSelector";
import { VisibilitySelector } from "./VisibilitySelector";
import { cn } from "@/lib/utils";
import type { RaffleMode, RaffleVisibility } from "@/lib/types";

interface FormData {
  mode: RaffleMode;
  visibility: RaffleVisibility;
  title: string;
  ticketPrice: string;
  maxParticipants: string;
  duration: string; // hours
  pin: string;
}

const STEPS = [
  { label: "Mode", description: "Choose your game" },
  { label: "Visibility", description: "Who can join?" },
  { label: "Configure", description: "Set the rules" },
  { label: "Review", description: "Confirm & create" },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {STEPS.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold transition-colors",
              i < currentStep
                ? "bg-mint border-mint text-bg-primary"
                : i === currentStep
                ? "border-mint text-mint"
                : "border-gray-700 text-gray-500"
            )}
          >
            {i < currentStep ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M5.5 11.2L1.8 7.5l1.4-1.4 2.3 2.3 5.3-5.3 1.4 1.4z" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          <div className="hidden sm:block">
            <p
              className={cn(
                "text-sm font-medium leading-none",
                i <= currentStep ? "text-cream" : "text-gray-500"
              )}
            >
              {step.label}
            </p>
            <p className="text-xs text-gray-500">{step.description}</p>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "w-8 sm:w-12 h-px mx-1",
                i < currentStep ? "bg-mint" : "bg-gray-700"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0 }),
};

export function CreateRaffleForm() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    mode: "roulette",
    visibility: "public",
    title: "",
    ticketPrice: "0.5",
    maxParticipants: "16",
    duration: "24",
    pin: "",
  });

  const update = (partial: Partial<FormData>) =>
    setFormData((prev) => ({ ...prev, ...partial }));

  const canAdvance = () => {
    if (step === 2) {
      if (!formData.title.trim()) return false;
      if (!formData.ticketPrice || parseFloat(formData.ticketPrice) <= 0) return false;
      if (!formData.maxParticipants || parseInt(formData.maxParticipants) < 2) return false;
      if (formData.visibility === "private" && !formData.pin.trim()) return false;
    }
    return true;
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const prev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleCreate = async () => {
    setSubmitting(true);
    // TODO: Call createRaffle contract function
    // For now, simulate a delay
    await new Promise((r) => setTimeout(r, 2000));
    setSubmitting(false);
    // TODO: Navigate to raffle detail page
  };

  const levels = Math.ceil(Math.log2(parseInt(formData.maxParticipants) || 2));

  return (
    <div>
      <StepIndicator currentStep={step} />

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Step 0: Mode */}
          {step === 0 && (
            <div>
              <h2 className="font-heading text-2xl font-bold text-cream mb-6">
                Choose Your Game Mode
              </h2>
              <ModeSelector
                value={formData.mode}
                onChange={(mode) => update({ mode })}
              />
            </div>
          )}

          {/* Step 1: Visibility */}
          {step === 1 && (
            <div>
              <h2 className="font-heading text-2xl font-bold text-cream mb-6">
                Who Can Join?
              </h2>
              <VisibilitySelector
                value={formData.visibility}
                onChange={(visibility) => update({ visibility })}
              />
            </div>
          )}

          {/* Step 2: Configure */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-heading text-2xl font-bold text-cream mb-6">
                Set the Rules
              </h2>
              <Input
                label="Raffle Title"
                placeholder="e.g. Spin to Win #1"
                value={formData.title}
                onChange={(e) => update({ title: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Ticket Price (AVAX)"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.5"
                  value={formData.ticketPrice}
                  onChange={(e) => update({ ticketPrice: e.target.value })}
                />
                <Input
                  label="Max Participants"
                  type="number"
                  min="2"
                  max="1024"
                  placeholder="16"
                  value={formData.maxParticipants}
                  onChange={(e) => update({ maxParticipants: e.target.value })}
                />
              </div>
              <Input
                label="Duration (hours)"
                type="number"
                min="1"
                max="720"
                placeholder="24"
                value={formData.duration}
                onChange={(e) => update({ duration: e.target.value })}
              />
              {formData.visibility === "private" && (
                <Input
                  label="PIN Code"
                  type="password"
                  placeholder="Enter a PIN for participants"
                  value={formData.pin}
                  onChange={(e) => update({ pin: e.target.value })}
                />
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h2 className="font-heading text-2xl font-bold text-cream mb-6">
                Review Your Raffle
              </h2>
              <Card className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Mode</p>
                    <p className="text-cream font-medium capitalize">
                      {formData.mode === "duckrace" ? "Duck Race" : "Roulette"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Visibility</p>
                    <p className="text-cream font-medium capitalize">
                      {formData.visibility}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Title</p>
                    <p className="text-cream font-medium">{formData.title || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ticket Price</p>
                    <p className="text-cream font-medium">
                      {formData.ticketPrice} AVAX
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Max Participants</p>
                    <p className="text-cream font-medium">
                      {formData.maxParticipants}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tree Levels</p>
                    <p className="text-cream font-medium">{levels}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="text-cream font-medium">
                      {formData.duration} hours
                    </p>
                  </div>
                  {formData.visibility === "private" && (
                    <div>
                      <p className="text-sm text-gray-500">PIN</p>
                      <p className="text-cream font-medium">{"*".repeat(formData.pin.length)}</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-10">
        <Button
          variant="secondary"
          onClick={prev}
          disabled={step === 0}
          className={step === 0 ? "invisible" : ""}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            variant="primary"
            onClick={next}
            disabled={!canAdvance()}
            className="glow-pulse"
          >
            Continue
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleCreate}
            loading={submitting}
            className="glow-pulse"
          >
            Create Raffle
          </Button>
        )}
      </div>
    </div>
  );
}
