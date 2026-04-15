'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="px-3 py-1 rounded-md border text-sm hover:bg-muted transition"
    >
      {dark ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}