"use client";

import { useState } from "react";
import { Sun, Moon } from "lucide-react";

export const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`
        relative w-12 h-12 rounded-full p-3 transition-all duration-300 ease-in-out
        hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring
        ${isDark 
          ? 'bg-secondary hover:bg-secondary/80 text-secondary-foreground' 
          : 'bg-primary hover:bg-primary/90 text-primary-foreground'
        }
      `}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <Sun 
          className={`
            absolute w-5 h-5 transition-all duration-300 ease-in-out
            ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}
        />
        <Moon 
          className={`
            absolute w-5 h-5 transition-all duration-300 ease-in-out
            ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
          `}
        />
      </div>
    </button>
  );
};