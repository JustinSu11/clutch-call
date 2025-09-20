'use client'

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ThemeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(true);

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
        <button onClick={toggleTheme} className={cn("fixed max-sm:hidden top-4 right-4 z-50 p-2 rounded-full transition-colors duration-300 cursor-pointer",
            "focus:outline-hidden"
        )}> 
            {isDarkMode ? ( 
                <Sun className='h-6 w-6 text-yellow-300'/> 
                ) : ( 
                <Moon className='h-6 w-6 text-text-secondary'/> 
            )} 
        </button>
    )
}