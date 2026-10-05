'use client';

import { useEffect } from 'react';
import { applyFontScale, FontScale } from '@/lib/ui/font-scale';

export function FontScaleSync({ fontScale }: { fontScale: FontScale }) {
  useEffect(() => {
    applyFontScale(document.documentElement, fontScale);
  }, [fontScale]);

  return null;
}
