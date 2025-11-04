'use client'

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ThemeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(true);

    //allow persistence of theme choice across page reloads
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark')
            setIsDarkMode(true);
        } else {
            document.documentElement.classList.remove('dark')
            setIsDarkMode(false);
        }
    }, [])

    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
            setIsDarkMode(false)
        } else { 
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
            setIsDarkMode(true)
        }
    }

    return (
        <button onClick={toggleTheme} className={cn("top-4 z-50 p-2 rounded-full transition-colors duration-300 cursor-pointer",
            "focus:outline-hidden"
        )}> 
            <span className="relative inline-flex w-6 h-6">
                {/* Sun (visible in dark mode) */}
                <Sun
                    size={20}
                    className={cn(
                        "absolute inset-0 m-auto transition-all duration-300 will-change-transform",
                        isDarkMode
                            ? "opacity-100 rotate-0 scale-100 text-yellow-300"
                            : "opacity-0 -rotate-90 scale-75 text-yellow-300"
                    )}
                />
                {/* Moon (visible in light mode) */}
                <Moon
                    size={20}
                    className={cn(
                        "absolute inset-0 m-auto transition-all duration-300 will-change-transform",
                        isDarkMode
                            ? "opacity-0 rotate-90 scale-75 text-text-primary"
                            : "opacity-100 rotate-0 scale-100 text-text-primary"
                    )}
                />
            </span>
        </button>
    )
}