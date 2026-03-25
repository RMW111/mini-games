#!/bin/bash
# Train a strong model on Vast.ai
# This runs in the background with output logged to training.log
#
# Usage:
#   bash train_strong.sh              # start fresh
#   bash train_strong.sh resume 150   # resume from iteration 150

set -e
cd /root/mini-games/ragnarocks-ai

RESUME_ARG=""
if [ "$1" = "resume" ] && [ -n "$2" ]; then
    RESUME_ARG="--resume checkpoints/model_iter_$2.pt"
    echo "Resuming from iteration $2..."
fi

nohup python -u train.py \
    --iterations 1000 \
    --games-per-iter 50 \
    --simulations 200 \
    --res-blocks 10 \
    --channels 128 \
    --lr 0.001 \
    $RESUME_ARG \
    > training.log 2>&1 &

echo "Training started in background (PID: $!)"
echo "Monitor progress: tail -f training.log"
