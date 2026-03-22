"use client";

import { motion } from "framer-motion";
import { CreateRaffleForm } from "@/components/create/CreateRaffleForm";

export default function CreateRafflePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-heading text-4xl font-bold text-cream mb-2">
          Create a Raffle
        </h1>
        <p className="text-gray-300 text-lg mb-10">
          Set up your private raffle in a few simple steps.
        </p>
      </motion.div>

      <CreateRaffleForm />
    </div>
  );
}
