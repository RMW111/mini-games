"""AlphaZero-style neural network: ResNet backbone + policy head + value head."""

from __future__ import annotations

import torch
import torch.nn as nn
import torch.nn.functional as F


class ResBlock(nn.Module):
    def __init__(self, channels: int):
        super().__init__()
        self.conv1 = nn.Conv2d(channels, channels, 3, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(channels)
        self.conv2 = nn.Conv2d(channels, channels, 3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(channels)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        residual = x
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out = F.relu(out + residual)
        return out


class RagnarocksNet(nn.Module):
    def __init__(
        self,
        in_channels: int = 6,
        num_rows: int = 10,
        max_cols: int = 11,
        total_actions: int = 12211,
        num_res_blocks: int = 5,
        hidden_channels: int = 64,
    ):
        super().__init__()
        self.num_rows = num_rows
        self.max_cols = max_cols
        self.total_actions = total_actions

        # Initial convolution
        self.conv_in = nn.Conv2d(in_channels, hidden_channels, 3, padding=1, bias=False)
        self.bn_in = nn.BatchNorm2d(hidden_channels)

        # Residual blocks
        self.res_blocks = nn.Sequential(
            *[ResBlock(hidden_channels) for _ in range(num_res_blocks)]
        )

        # Policy head
        self.policy_conv = nn.Conv2d(hidden_channels, 2, 1, bias=False)
        self.policy_bn = nn.BatchNorm2d(2)
        self.policy_fc = nn.Linear(2 * num_rows * max_cols, total_actions)

        # Value head
        self.value_conv = nn.Conv2d(hidden_channels, 1, 1, bias=False)
        self.value_bn = nn.BatchNorm2d(1)
        self.value_fc1 = nn.Linear(num_rows * max_cols, 64)
        self.value_fc2 = nn.Linear(64, 1)

    def forward(self, x: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        """
        Args:
            x: (batch, 6, num_rows, max_cols) board tensor

        Returns:
            policy_logits: (batch, total_actions) raw logits
            value: (batch, 1) position evaluation in [-1, 1]
        """
        # Backbone
        out = F.relu(self.bn_in(self.conv_in(x)))
        out = self.res_blocks(out)

        # Policy
        p = F.relu(self.policy_bn(self.policy_conv(out)))
        p = p.view(p.size(0), -1)
        policy_logits = self.policy_fc(p)

        # Value
        v = F.relu(self.value_bn(self.value_conv(out)))
        v = v.view(v.size(0), -1)
        v = F.relu(self.value_fc1(v))
        value = torch.tanh(self.value_fc2(v))

        return policy_logits, value
