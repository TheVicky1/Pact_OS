
import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface CharacterCounterBadgeProps {
  currentLength: number;
  maxLength: number;
  warningThreshold?: number;
  isFocused?: boolean;
}

export function CharacterCounterBadge({
  currentLength,
  maxLength,
  warningThreshold = 0.8,
  isFocused = false,
}: CharacterCounterBadgeProps) {
  if (currentLength === 0 && !isFocused) {
    return null;
  }

  const isOverLimit = currentLength > maxLength;
  const isNearLimit = currentLength >= maxLength * warningThreshold;

  const variant = isOverLimit
    ? 'danger'
    : isNearLimit
      ? 'warning'
      : 'neutral';

  return (
    <Badge
      variant={variant}
      size="sm"
      role="status"
      aria-live="polite"
    >
      {currentLength} / {maxLength}
    </Badge>
  );
}
