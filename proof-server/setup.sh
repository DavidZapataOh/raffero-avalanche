#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# Raffero Proof Server — Setup Script
# Run this on your dedicated machine (PC/VPS with WSL or Linux)
# ══════════════════════════════════════════════════════════════════════════════

set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     Raffero Proof Server — Setup             ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# 1. Check Node.js
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found. Install it: https://nodejs.org"
    exit 1
fi
echo "✓ Node.js $(node --version)"

# 2. Check/Install bb (Barretenberg)
echo ""
echo "Checking bb (Barretenberg)..."
if ! command -v bb &> /dev/null; then
    echo "bb not found. Installing..."
    curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/cpp/installation/install | bash
    export PATH="$HOME/.bb:$PATH"
    if ! command -v bb &> /dev/null; then
        echo "✗ bb installation failed. Try manually: https://github.com/AztecProtocol/aztec-packages"
        exit 1
    fi
fi
echo "✓ bb $(bb --version)"

# 3. Check nargo
echo ""
echo "Checking nargo..."
if ! command -v nargo &> /dev/null; then
    echo "⚠ nargo not found. You'll need it to rebuild circuits."
    echo "  Install: curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash && noirup -v 1.0.0-beta.9"
else
    echo "✓ nargo $(nargo --version | head -1)"
fi

# 4. Install proof server dependencies
echo ""
echo "Installing proof server dependencies..."
cd "$(dirname "$0")"
npm install

# 5. Install js-scripts dependencies
echo ""
echo "Installing js-scripts dependencies..."
cd ../js-scripts
npm install

# 6. Build circuits if needed
echo ""
cd ../circuits/shuffle
if [ ! -f "target/shuffle.json" ]; then
    echo "Building shuffle circuit..."
    nargo build
else
    echo "✓ Shuffle circuit already built"
fi

# Generate keccak VK if needed
if [ ! -f "target/vk_keccak/vk" ]; then
    echo "Generating shuffle verification key (keccak)..."
    bb write_vk -s ultra_honk --oracle_hash keccak -b target/shuffle.json -o target/vk_keccak
else
    echo "✓ Shuffle VK (keccak) already exists"
fi

cd ../../proof-server

echo ""
echo "══════════════════════════════════════════════"
echo "✓ Setup complete!"
echo ""
echo "To start the proof server:"
echo "  cd proof-server"
echo "  FRONTEND_URL=https://your-vercel-domain.vercel.app npm start"
echo ""
echo "To keep it running permanently:"
echo "  npm install -g pm2"
echo "  FRONTEND_URL=https://your-vercel-domain.vercel.app pm2 start server.mjs --name raffero-proofs"
echo "  pm2 save"
echo "  pm2 startup"
echo "══════════════════════════════════════════════"
