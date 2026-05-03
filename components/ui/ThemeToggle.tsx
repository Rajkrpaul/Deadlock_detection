'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, ChevronDown } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors select-none"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Moon className="w-3.5 h-3.5 text-foreground" />
      ) : (
        <Sun className="w-3.5 h-3.5 text-foreground" />
      )}
      <span>{isDark ? 'Dark' : 'Light'}</span>
      <ChevronDown className="w-3 h-3 opacity-50" />
    </button>
  );
}