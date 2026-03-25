#!/bin/bash
# Setup script for training on Vast.ai
# Run this after connecting to your Vast.ai instance:
#   bash setup_vastai.sh

set -e

echo "=== Setting up Ragnarocks AI training ==="

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# Clone repo
cd /root
git clone https://github.com/RMW111/mini-games.git
cd mini-games/ragnarocks-ai

# Install Python dependencies
pip install torch numpy maturin

# Build Rust engine
cd engine
maturin develop --release
cd ..

echo ""
echo "=== Setup complete! ==="
echo ""
echo "To start training, run:"
echo "  python train.py --iterations 1000 --games-per-iter 50 --simulations 200 --res-blocks 10 --channels 128"
echo ""
echo "To check progress from another terminal:"
echo "  tail -f /root/mini-games/ragnarocks-ai/training.log"
