# Raffero - Implementation Plan

## 1. Vision & Identity

**Raffero** is a privacy-preserving raffle dApp built on Avalanche with ZK proofs. The frontend delivers two game modes — **Roulette** and **Duck Race** — wrapped in a **1930s rubber-hose cartoon aesthetic** that makes participating in raffles feel playful, nostalgic, and addictive.

### Brand Colors (60-30-10 Rule)

Following the color principles from colors.txt, we apply the 60-30-10 rule:

| Role | Color | Usage |
|------|-------|-------|
| **60% Dominant (Background/Neutrals)** | `#040404` near-black + `#0d0d0d` / `#141414` surface grays | Page background, card backgrounds, large neutral areas |
| **30% Secondary** | `#53e3c3` (mint/teal) at varying opacities | Buttons, headings, active states, progress bars, key UI accents |
| **10% Accent** | `#f5f0e1` (warm cream/ivory) | Text, labels, small highlights — the "vintage paper" tone |

#### Extended Palette (Analogous & Complementary)

Rotating `#53e3c3` on the color wheel and applying dark-mode principles from colors.txt:

| Name | Hex | Use |
|------|-----|-----|
| Mint Primary | `#53e3c3` | Primary CTAs, active states, key highlights |
| Mint Muted | `#53e3c3` at 15-20% opacity | Card backgrounds, subtle tints on dark surfaces |
| Teal Deep | `#2a9d8f` | Hover states, secondary buttons |
| Aqua Light | `#76edd5` | Hover highlights, glow effects |
| Warm Cream | `#f5f0e1` | Primary text, vintage paper accents |
| Soft Gray | `#a8a8a8` | Secondary text, less-important labels |
| Mid Gray | `#2a2a2a` | Borders, card surfaces, dividers |
| Coral Accent | `#e3536e` | Destructive actions, error states, notifications |
| Gold Accent | `#e3c353` | Warnings, special badges, "premium" feel |
| Pure White | `#ffffff` | Sparingly — only for the most important text/logos |

#### Dark Mode Color Principles (from colors.txt)

- **Never invert light mode** — build the dark palette with dark-mode goals in mind
- **Backgrounds stay dark**, foreground surfaces are slightly lighter (`#0d0d0d` → `#141414` → `#1a1a1a`)
- **Reserve pure white** for the most critical elements (logo, primary headings)
- **Use light grays** (`#a8a8a8`, `#d4d4d4`) for body text instead of white — reduces eye strain
- **Borders need more contrast** on dark backgrounds — use `#2a2a2a` to `#3a3a3a`
- **Desaturate the logo** slightly for dark backgrounds
- **Tint neutral grays** with a hint of `#53e3c3` for brand cohesion (e.g., `#0a1210` as a tinted near-black)

#### Semantic Colors

- **Red** (`#e3536e`) for destructive/delete actions — never use brand color for destructive buttons (colors.txt principle)
- **Green** (`#53e3c3` itself doubles as success) for confirmations
- **Disabled states**: desaturate the base color, use `#3a3a3a` bg + `#666` text
- **Hover**: slightly lighter/brighter version of base
- **Active/Press**: slightly darker version of base

---

## 2. Design System — 1930s Rubber-Hose Cartoon Style

### Visual Language

- **Typography**: Custom display font for headings (e.g., `Bungee Shade` or `Fredoka One` for a round, cartoonish feel). Body text in a clean sans-serif (`Inter` or `Space Grotesk`) for readability.
- **Illustrations**: SVG rubber-hose style characters — bendy arms/legs, white gloves, exaggerated expressions. Ducks with rubber-hose limbs for the duck race.
- **UI Elements**: Rounded corners (border-radius: 16-24px), subtle shadows that mimic old-timey card/poster depth, "wobbly" borders for a hand-drawn feel.
- **Animations**: Squash-and-stretch on buttons, bouncy entrances, film-grain overlay (subtle CSS noise), scanline effects (optional, very subtle).
- **Iconography**: Custom SVG icons with thick, rounded strokes — consistent with the 1930s aesthetic.
- **Cards**: Simple borders on dark backgrounds (following colors.txt — "sometimes a simple border is the best solution"). Background-less cards with `#2a2a2a` borders to avoid clutter.
- **Icons should be colorless** by default — only use color to communicate status (active tab, selected state), following colors.txt principles.

### Motion Design

- CSS transitions with ease-in-out (200-300ms) for standard interactions
- Spring animations (via Framer Motion) for:
  - Roulette spinning
  - Duck race movement
  - Card entrances
  - Toast notifications
  - Button squash-and-stretch on press

---

## 3. Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Animation | Framer Motion |
| Wallet | Privy (`@privy-io/react-auth`) |
| Web3 | viem + wagmi |
| ZK Proofs | `@noir-lang/noir_js` + `@noir-lang/backend_barretenberg` |
| State | React Context + `zustand` (lightweight store) |
| Canvas/WebGL | HTML5 Canvas for duck race, CSS/SVG for roulette |
| Fonts | Google Fonts (Bungee Shade + Inter) |

### Directory Structure

```
frontend/
├── app/
│   ├── layout.tsx                    # Root layout (Privy provider, fonts, theme)
│   ├── page.tsx                      # Landing / Home
│   ├── raffle/
│   │   ├── [id]/
│   │   │   ├── page.tsx              # Raffle detail (roulette or duck-race view)
│   │   │   ├── claim/
│   │   │   │   └── page.tsx          # Claim prize page (ZK proof generation)
│   │   │   └── join/
│   │   │       └── page.tsx          # Join raffle (buy ticket)
│   │   └── create/
│   │       └── page.tsx              # Create new raffle
│   ├── explore/
│   │   └── page.tsx                  # Browse public raffles
│   └── my-raffles/
│       └── page.tsx                  # User's participated/created raffles
├── components/
│   ├── ui/                           # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Countdown.tsx
│   │   ├── Toast.tsx
│   │   └── Skeleton.tsx
│   ├── layout/
│   │   ├── Header.tsx                # Navbar with logo + wallet
│   │   ├── Footer.tsx
│   │   └── Container.tsx
│   ├── raffle/
│   │   ├── RaffleCard.tsx            # Card for raffle listing
│   │   ├── RaffleStatus.tsx          # Open/Closed/Claimed badge
│   │   ├── ParticipantCount.tsx      # Shows slots filled
│   │   └── PrizePool.tsx             # Prize pool display
│   ├── roulette/
│   │   ├── RouletteWheel.tsx         # SVG/Canvas spinning wheel
│   │   ├── RouletteResult.tsx        # Winner reveal animation
│   │   └── AliasSlice.tsx            # Individual segment with alias
│   ├── duckrace/
│   │   ├── DuckRaceTrack.tsx         # Canvas race track
│   │   ├── Duck.tsx                  # Individual duck with alias
│   │   ├── RaceResult.tsx            # Winner duck celebration
│   │   └── WaterEffect.tsx           # Water animation
│   ├── create/
│   │   ├── CreateRaffleForm.tsx      # Full creation flow
│   │   ├── ModeSelector.tsx          # Roulette vs Duck Race toggle
│   │   ├── VisibilitySelector.tsx    # Public/Hidden/Private
│   │   └── PriceInput.tsx            # Ticket price input
│   ├── wallet/
│   │   ├── ConnectButton.tsx         # Privy connect wrapper
│   │   └── WalletInfo.tsx            # Connected wallet display
│   └── effects/
│       ├── FilmGrain.tsx             # Subtle noise overlay
│       ├── Confetti.tsx              # Winner celebration
│       └── CartoonBorder.tsx         # Wobbly border component
├── hooks/
│   ├── useRaffle.ts                  # Read raffle data from contract
│   ├── useDepositTicket.ts           # Buy ticket transaction
│   ├── useClaimPrize.ts             # Generate ZK proof + claim
│   ├── useCreateRaffle.ts            # Create raffle transaction
│   ├── useCountdown.ts               # Timer until raffle closes
│   └── useProofGeneration.ts         # Noir proof generation
├── lib/
│   ├── contracts.ts                  # Contract addresses + ABIs
│   ├── viem.ts                       # viem client configuration
│   ├── privy.ts                      # Privy configuration
│   ├── noir.ts                       # Noir circuit loading + proof gen
│   ├── commitment.ts                 # Generate commitment from secret+nullifier
│   ├── merkle.ts                     # Client-side Merkle tree utils
│   ├── poseidon.ts                   # Poseidon2 hash (JS implementation)
│   ├── constants.ts                  # Domain tags, zero hashes, chain config
│   └── types.ts                      # TypeScript types
├── store/
│   ├── useRaffleStore.ts             # Zustand store for raffle state
│   └── useUserStore.ts               # User secrets, tickets, nullifiers
├── styles/
│   └── globals.css                   # Tailwind + CSS custom properties + effects
└── public/
    ├── fonts/
    ├── images/
    │   ├── duck-sprites/             # Duck character sprites/SVGs
    │   ├── roulette/                 # Roulette wheel assets
    │   ├── characters/               # Rubber-hose mascot(s)
    │   └── logo.svg                  # Raffero logo
    └── sounds/                       # Optional: roulette spin, duck quack
```

---

## 4. Pages & Features

### 4.1 Landing Page (`/`)

**Purpose**: Hook users immediately — showcase the fun, explain the privacy.

**Sections**:
1. **Hero**: Full-width with rubber-hose mascot character, animated tagline ("Private Raffles. Public Fun."), glowing `#53e3c3` CTA "Enter a Raffle" or "Create One".
2. **How it Works**: 3-step visual (Pick alias → Join raffle → Watch the show) with rubber-hose icons.
3. **Live Raffles Preview**: 2-3 cards of active public raffles with countdown timers.
4. **Privacy Promise**: Brief section explaining ZK proofs in human terms — "Your alias is yours. Nobody can link it to you."

### 4.2 Explore Raffles (`/explore`)

**Purpose**: Browse and filter public raffles.

**Features**:
- Grid of `RaffleCard` components
- Filters: Mode (Roulette/Duck Race), Status (Open/Drawing/Completed)
- Each card shows: mode icon, participant count, prize pool, countdown, ticket price
- Cards use borders (no colored backgrounds) — clean dark surfaces

### 4.3 Create Raffle (`/raffle/create`)

**Purpose**: Step-by-step raffle creation.

**Flow (multi-step form)**:
1. **Mode Selection**: Choose Roulette or Duck Race (large illustrated toggles)
2. **Visibility**: Public / Hidden / Private
   - Public: appears in `/explore`
   - Hidden: only accessible via shareable link
   - Private: requires PIN/code to join (entered before buying ticket)
3. **Configuration**: Ticket price (in AVAX), max participants (determines tree levels), time limit
4. **Review & Create**: Summary card → "Create Raffle" button → calls `createRaffle()` on contract
5. **Share**: After creation, show shareable link (and PIN if private)

**Web3 Interaction**:
- `createRaffle(raffleId, ticketPrice, levels)` via viem
- `raffleId` generated client-side (hash of timestamp + creator + nonce)
- `levels` computed from `Math.ceil(Math.log2(maxParticipants))`
- Raffle metadata (mode, visibility, title, PIN hash) stored off-chain (could use IPFS or a simple backend — for MVP, localStorage + URL params)

### 4.4 Raffle Detail (`/raffle/[id]`)

**Purpose**: The main stage — where participants join and watch the draw.

**States**:

#### State 1: Open (Accepting Participants)
- Countdown timer (animated, vintage clock style)
- "Join Raffle" CTA → navigates to `/raffle/[id]/join`
- Participant count (e.g., "7/16 spots filled")
- Prize pool (live-updating)
- List of aliases already joined (displayed as rubber-hose characters or name tags)
- If Private: PIN input gate before showing raffle details

#### State 2: Drawing (Raffle Closed, Determining Winner)
- **Roulette Mode**: Animated spinning wheel with all aliases on slices → slows down → lands on winner
- **Duck Race Mode**: Canvas animation of ducks racing across water → winner duck crosses finish line
- Dramatic countdown or "Drawing..." animation before the main event

#### State 3: Completed (Winner Announced)
- Winner alias displayed with celebration animation (confetti, spotlight)
- "Claim Prize" button (only functional for the actual winner who knows their secret)
- Prize amount displayed
- Share result button

### 4.5 Join Raffle (`/raffle/[id]/join`)

**Purpose**: Buy a ticket with a private alias.

**Flow**:
1. **Connect Wallet** (if not connected — Privy modal)
2. **Choose Alias**: Text input for alias (displayed on roulette/duck)
3. **Generate Secrets**: Client-side generation of `secret` and `nullifier` (random fields)
4. **Compute Commitment**: `commitment = Poseidon2(DOMAIN_COMMIT, secret, nullifier)`
5. **Compute Entry Hash**: `entry_hash = Poseidon2(DOMAIN_ENTRY, commitment, alias_as_field)`
6. **Buy Ticket**: Send transaction `depositTicket(raffleId, commitment)` with `msg.value = ticketPrice`
7. **Save Locally**: Store `{ secret, nullifier, alias, raffleId, leafIndex }` in localStorage (encrypted with wallet signature)
8. **Confirmation**: Show success with alias displayed on a rubber-hose name tag

**Critical UX**: Warn user to NOT clear browser data — their secret is needed to claim prizes. Offer option to download backup file.

### 4.6 Claim Prize (`/raffle/[id]/claim`)

**Purpose**: Winner generates ZK proof and claims prize.

**Flow**:
1. **Load Secrets**: Retrieve `{ secret, nullifier }` from localStorage
2. **Fetch On-Chain Data**: Get Merkle root, winner index, tree data
3. **Compute Merkle Proof**: Build proof path from on-chain commitments
4. **Generate ZK Proof**: Use Noir.js + Barretenberg to generate proof with inputs:
   - Private: `secret, nullifier, siblings, path_indices, recipient`
   - Public: `root, nullifier_hash, recipient_binding, raffle_id, winner_index, tree_depth`
5. **Submit Claim**: Call `claimPrize(proofA, proofB, proofC, pubSignals, recipient)`
6. **Celebration**: Full-screen confetti + prize amount animation

**Loading State**: Proof generation takes time — show vintage "loading reel" animation with progress steps.

### 4.7 My Raffles (`/my-raffles`)

**Purpose**: Track raffles user has created or participated in.

**Tabs**:
- **Participated**: List of raffles joined, with status and claim buttons
- **Created**: List of raffles created by user, with management options

---

## 5. Component Specifications

### 5.1 Roulette Wheel (`RouletteWheel.tsx`)

- **Rendering**: SVG-based wheel divided into equal slices
- **Each slice**: Shows the participant's alias in a curved text path
- **Colors**: Alternating between `#53e3c3` at 20% opacity and `#1a1a1a` for slice backgrounds. Active/winner slice fully saturated.
- **Animation**: CSS transform rotation with easing curve that decelerates. Final position calculated from `winnerIndex`.
- **Spin trigger**: Starts spinning when raffle status changes to "drawing"
- **Sound**: Optional click sound on each alias pass

### 5.2 Duck Race (`DuckRaceTrack.tsx`)

- **Rendering**: HTML5 Canvas with 2D context
- **Track**: Horizontal lanes with water effect (sine wave animation)
- **Ducks**: Rubber-hose style SVG sprites, each labeled with alias
- **Animation**: Each duck moves at a pseudo-random speed derived from on-chain randomness. Winner duck is pre-determined by `winnerIndex` — animation is choreographed so that duck wins.
- **Finish Line**: Checkered flag with spotlight on winner
- **Lane Assignment**: Each participant gets a lane (max ~8-16 visible, scroll if more)

### 5.3 Countdown Timer (`Countdown.tsx`)

- Vintage flip-clock style digits
- Shows days:hours:minutes:seconds
- Color shifts from cream to `#53e3c3` in last 60 seconds
- Pulses when < 10 seconds

### 5.4 Connect Button (`ConnectButton.tsx`)

- Wraps Privy's login button
- Shows truncated address when connected
- Rubber-hose hand icon pointing to button when not connected
- Dropdown: disconnect, copy address, view on explorer

---

## 6. Web3 Integration

### 6.1 Privy Setup

```
Provider Hierarchy:
app/layout.tsx
  └── PrivyProvider (appId, config)
      └── WagmiProvider (viem config)
          └── QueryClientProvider
              └── {children}
```

**Config**:
- Chain: Avalanche C-Chain (or Fuji testnet)
- Login methods: wallet, email, social (Privy handles abstraction)
- Appearance: dark theme matching `#040404` background

### 6.2 viem Configuration

- Public client for reads (raffle data, events, Merkle tree)
- Wallet client for writes (via Privy's embedded wallet or injected)
- Contract instances for `PrivateRaffle` and `UltraVerifier`

### 6.3 Contract Interactions

| Action | Contract Method | Tx/Read | Notes |
|--------|----------------|---------|-------|
| Create raffle | `createRaffle(id, price, levels)` | Tx | Owner only |
| Buy ticket | `depositTicket(raffleId, commitment)` | Tx + value | Payable |
| Close raffle | `closeAndSetWinner(raffleId, rand)` | Tx | Owner only |
| Claim prize | `claimPrize(pA, pB, pC, signals, recipient)` | Tx | ZK proof |
| Get raffle | Read `raffles[id]` | Read | Public mapping |
| Get commitment | Read `commitments[id][idx]` | Read | For Merkle proof |
| Check nullifier | Read `nullifiers[id][hash]` | Read | Double-claim check |
| Listen events | `TicketDeposited`, `RaffleClosed`, etc. | Event | Real-time updates |

### 6.4 ZK Proof Generation (Client-Side)

```
Flow:
1. Load compiled Noir circuit (raffle.json artifact)
2. Initialize Barretenberg backend
3. Prepare witness inputs (private + public)
4. Generate proof
5. Extract proof components (pA, pB, pC) and public signals
6. Submit to contract
```

**Key Libraries**:
- `@noir-lang/noir_js` — circuit execution
- `@noir-lang/backend_barretenberg` — proof generation
- Custom `poseidon.ts` — matching the on-chain Poseidon2 implementation

---

## 7. State Management

### 7.1 Zustand Store: `useRaffleStore`

```typescript
interface RaffleStore {
  // Current raffle being viewed
  currentRaffle: Raffle | null
  participants: Participant[]

  // Actions
  fetchRaffle: (id: string) => Promise<void>
  subscribeToEvents: (id: string) => void
}
```

### 7.2 Local Storage: User Secrets

```typescript
interface UserTicket {
  raffleId: string
  secret: string        // Field element (hex)
  nullifier: string     // Field element (hex)
  alias: string
  leafIndex: number
  commitment: string    // Computed commitment hash
  timestamp: number
}
```

**Security**: Secrets encrypted with a key derived from wallet signature. User must be connected to decrypt.

---

## 8. Implementation Phases

### Phase 1: Foundation (Steps 1-5)

1. **Project Setup & Dependencies**
   - Install: `privy`, `viem`, `wagmi`, `framer-motion`, `zustand`, `@noir-lang/noir_js`, `@noir-lang/backend_barretenberg`
   - Configure Tailwind with custom color tokens (CSS custom properties)
   - Set up Google Fonts (Bungee Shade + Inter or similar)
   - Configure path aliases and project structure

2. **Design System & Theme**
   - Create `globals.css` with CSS custom properties for all colors
   - Build UI primitives: Button, Card, Input, Modal, Badge, Skeleton
   - Implement FilmGrain overlay and CartoonBorder effect
   - Set up Framer Motion defaults (spring configs, transition presets)

3. **Layout & Navigation**
   - Build Header with logo, nav links, wallet connect
   - Build Footer
   - Implement root layout with Privy + Wagmi providers
   - Mobile-responsive navigation (hamburger menu with rubber-hose animation)

4. **Wallet Integration (Privy)**
   - Set up PrivyProvider with Avalanche chain config
   - Build ConnectButton component
   - Handle wallet states (connecting, connected, disconnecting)
   - Test with Fuji testnet

5. **Web3 Layer (viem)**
   - Configure public and wallet clients
   - Define contract ABIs and addresses in `lib/contracts.ts`
   - Build base hooks: `useRaffle`, `useCreateRaffle`, `useDepositTicket`
   - Event listeners for real-time updates

### Phase 2: Core Features (Steps 6-9)

6. **Explore Page**
   - Fetch and display public raffles
   - RaffleCard component with mode icon, countdown, prize pool
   - Filtering and status indicators

7. **Create Raffle Flow**
   - Multi-step form with ModeSelector, VisibilitySelector, config inputs
   - Transaction submission and confirmation
   - Shareable link generation
   - PIN system for private raffles (hash PIN client-side, store hash in URL or off-chain)

8. **Join Raffle Flow**
   - Alias input with character limit and validation
   - Client-side secret/nullifier generation
   - Poseidon2 commitment computation
   - Transaction submission
   - Local storage of secrets with backup download option

9. **Raffle Detail Page (Static States)**
   - Open state with countdown, participant list, prize pool
   - Completed state with winner display
   - PIN gate for private raffles

### Phase 3: Game Modes (Steps 10-12)

10. **Roulette Wheel**
    - SVG wheel with dynamic slice generation
    - Spin animation with configurable final position
    - Winner reveal with spotlight effect
    - Sound effects (optional)

11. **Duck Race**
    - Canvas-based race track with water effects
    - Duck sprites with alias labels
    - Race animation choreographed to predetermined winner
    - Finish line celebration

12. **Winner Celebration & Claim**
    - Confetti animation
    - Prize display
    - ZK proof generation flow (with loading animation)
    - Claim transaction submission

### Phase 4: Polish (Steps 13-15)

13. **My Raffles Dashboard**
    - Participated tab with claim status
    - Created tab with management
    - Local secret recovery

14. **Animations & Microinteractions**
    - Button squash-and-stretch
    - Page transitions
    - Card entrance animations
    - Loading states with vintage reel effect
    - Toast notifications with rubber-hose style

15. **Responsive Design & Testing**
    - Mobile-first responsive adjustments
    - Touch interactions for mobile (no hover states — use press effects per colors.txt)
    - Cross-browser testing
    - Accessibility pass (WCAG contrast compliance — following colors.txt principles)

---

## 9. Privacy UX Considerations

### What Users Need to Understand
- Their alias is **visible to other participants** but **not linked to their wallet address**
- The ZK proof lets the winner claim without revealing which alias was theirs
- Secrets are stored **locally** — losing them means losing the ability to claim
- The shuffle circuit ensures even the operator can't link aliases to wallets

### UX Patterns
- **"Your Secret Key" modal** after joining — force user to acknowledge/backup
- **Recovery file download** — JSON with encrypted secrets
- **Alias input hints** — "Choose a fun alias! Only you'll know it's you."
- **Privacy indicator** — small lock icon with tooltip explaining the ZK privacy model

---

## 10. Off-Chain Data & Metadata

Since the smart contract only stores commitments and Merkle roots, some metadata must live off-chain:

| Data | Storage | Notes |
|------|---------|-------|
| Raffle mode (roulette/duck) | URL param or IPFS | Not on-chain |
| Raffle title/description | URL param or IPFS | Not on-chain |
| Visibility type | URL param / creator localStorage | Not on-chain |
| Private raffle PIN hash | URL fragment | Never sent to server |
| Aliases | Stored in shuffle circuit / events | Committed via entry_hash |
| User secrets | Browser localStorage (encrypted) | Never leaves client |

For the MVP, we can use URL parameters and localStorage. A future version could use IPFS or a lightweight backend for metadata persistence.

---

## 11. Key Technical Challenges

1. **Poseidon2 in JavaScript**: Must match the exact Poseidon2 implementation used in Noir circuits and Solidity. Use `@noir-lang/noir_js` Poseidon or a compatible JS library.

2. **Proof Generation Performance**: Barretenberg proof generation can take 10-30s in browser. Use Web Workers to avoid blocking UI. Show engaging loading animation.

3. **Merkle Tree Reconstruction**: Client must rebuild the Merkle path from on-chain `commitments` events. Read all `TicketDeposited` events for the raffle to reconstruct the tree.

4. **Duck Race Determinism**: The race animation must be deterministic — given the same `winnerIndex`, the same duck always wins. Use seeded pseudo-random for other ducks' speeds.

5. **Mobile Canvas Performance**: Duck race canvas must perform well on mobile. Use requestAnimationFrame, limit draw calls, consider reducing visual fidelity on low-end devices.

---

## 12. Dependencies to Install

```bash
# Core
pnpm add @privy-io/react-auth viem wagmi @tanstack/react-query

# ZK/Crypto
pnpm add @noir-lang/noir_js @noir-lang/backend_barretenberg

# UI/Animation
pnpm add framer-motion zustand

# Dev
pnpm add -D @types/node
```

---

## 13. File Creation Order

Following the phase structure, files should be created in this order:

1. `lib/constants.ts` → `lib/types.ts` → `lib/contracts.ts`
2. `lib/privy.ts` → `lib/viem.ts`
3. `styles/globals.css` (theme overhaul)
4. `components/ui/*` (all primitives)
5. `components/layout/*` (Header, Footer)
6. `app/layout.tsx` (providers)
7. `app/page.tsx` (landing)
8. `components/wallet/*`
9. `hooks/useRaffle.ts` → `hooks/useCreateRaffle.ts` → `hooks/useDepositTicket.ts`
10. `app/explore/page.tsx` + `components/raffle/*`
11. `app/raffle/create/page.tsx` + `components/create/*`
12. `app/raffle/[id]/join/page.tsx`
13. `app/raffle/[id]/page.tsx`
14. `components/roulette/*`
15. `components/duckrace/*`
16. `lib/noir.ts` → `lib/poseidon.ts` → `lib/commitment.ts` → `lib/merkle.ts`
17. `hooks/useProofGeneration.ts` → `hooks/useClaimPrize.ts`
18. `app/raffle/[id]/claim/page.tsx`
19. `store/*`
20. `app/my-raffles/page.tsx`
21. `components/effects/*` (FilmGrain, Confetti, CartoonBorder)
