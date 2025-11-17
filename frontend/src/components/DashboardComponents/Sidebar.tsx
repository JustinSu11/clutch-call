/*
    File: src/components/DashboardComponents/Sidebar.tsx
    Created: 09/19/2025 
    Author: CJ Quintero

    Last Updated: 11/01/2025 by Justin Nguyen

    Description: This file has the code for the sidebar component in the dashboard.
*/
"use client"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { Home, ChartScatter, AlignJustify, X, Trophy, Award } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"


const navItems = [
    {
        title: 'Home',
        href: '/dashboard',
        icon: Home,
    },
    {
        title: 'Predictions',
        href: '/predictions',
        icon: ChartScatter,
    },
    {
        title: 'Team Comparisons',
        href: '/team-comparisons',
        icon: Trophy,
    },
    {
        title: 'Standings',
        href: '/standings',
        icon: Award,
    }
]

export default function Sidebar() {
    /*
        Sidebar()

        This component renders the sidebar for the dashboard layout.

        Returns:
        A JSX element representing the sidebar component.
    */

    const pathname = usePathname()
    const currentTitle = navItems.find(item => pathname?.startsWith(item.href))?.title

    const [isSideBarOpen, setIsSideBarOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [dragStartX, setDragStartX] = useState<number | null>(null)
    const [lastX, setLastX] = useState<number | null>(null)
    const [dragOffset, setDragOffset] = useState(0)
    const threshold = 28 // px needed to commit a swipe

    // Edge swipe to OPEN
    function edge_onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        setDragStartX(e.clientX)
        setLastX(e.clientX)
    }
    function edge_onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (dragStartX == null) return
        setLastX(e.clientX)
    }
    function edge_onPointerUp() {
        if (dragStartX != null && lastX != null && lastX - dragStartX >= threshold) {
            setIsMobileMenuOpen(true)
        }
        setDragStartX(null); setLastX(null)
    }

    // Drawer swipe to CLOSE
    function drawer_onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        setDragStartX(e.clientX)
        setLastX(e.clientX)
    }
    function drawer_onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (dragStartX == null) return
        setLastX(e.clientX)
    }
    function drawer_onPointerUp() {
        if (dragStartX != null && lastX != null && dragStartX - lastX >= threshold) {
            setIsMobileMenuOpen(false)
        }
        setDragStartX(null); setLastX(null)
    }

    function handleSideBarOpenClose() {
        setIsSideBarOpen(!isSideBarOpen)
    }

    function isSmallScreen() {
        return window.innerWidth < 640
    }

    // Lock scroll only while the mobile menu is open
    useEffect(() => {
        const lock = () => {
            document.documentElement.style.overflow = "hidden"
            document.body.style.overflow = "hidden"
        }
        const unlock = () => {
            document.documentElement.style.overflow = ""
            document.body.style.overflow = ""
        }
        if (isMobileMenuOpen) lock()
        else unlock()
        return () => unlock()
    }, [isMobileMenuOpen])

    // On resize to desktop, ensure the menu is closed and scrolling is restored
    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 640) {
                setIsMobileMenuOpen(false)
                document.documentElement.style.overflow = ""
                document.body.style.overflow = ""
            }
        }
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [])

    return (
        <div>
            {/* Desktop / tablet sidebar (hidden on small screens) */}
            <aside className={`hidden sm:flex sticky top-0 self-start flex-col ${isSideBarOpen ? "w-64" : "w-16"} h-[100vh] bg-secondary-background py-6 px-1 transition-[width] duration-300 ease-in-out overflow-hidden`}>
                <div className="flex flex-col h-full">
                    {/* The header for the sidebar */}
                    <div className="flex text-3xl font-bold text-text-primary gap-3">
                        <Button variant="ghost" className="mb-8 ml-1 text-text-primary hover:text-primary hover:bg-secondary transition-transform duration-300" onClick={handleSideBarOpenClose}>
                             <span className="relative inline-block w-4 h-6">
                                <AlignJustify size={24} className={`absolute inset-0 m-auto transition-all duration-300 will-change-transform ${isSideBarOpen ? "opacity-0 -rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"}`}/>
                                <X size={20} className={`absolute inset-0 m-auto transition-all duration-300 will-change-transform ${isSideBarOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75"}`}/>
                            </span>
                        </Button>
                        <span className={`whitespace-nowrap transition-all duration-200 ${isSideBarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"}`}>
                            ClutchCall
                        </span>
                    </div>
                    <nav className="flex flex-col gap-2">
                        {
                            navItems.map((item) => (
                                <Link
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-text-primary font-medium hover:text-primary ${item.title === currentTitle ? "bg-secondary text-primary" : "text-text-primary"}`}
                                    href={item.href}
                                    id={item.title}
                                    key={item.title}
                                >
                                    <item.icon className="flex-shrink-0 transition-transform duration-200" />
                                    { isSideBarOpen && (<span className="opacity-100 translate-x-0 whitespace-nowrap overflow-hidden">{item.title}</span>) }
                                </Link>
                            ))
                        }
                    </nav>
                </div>
                <div className="mx-auto">
                    <ThemeToggle />
                </div>
            </aside>

            {/* Mobile edge-swipe activator: swipe right to open */}
            {!isMobileMenuOpen && (
                <div
                    className="sm:hidden fixed left-0 top-0 h-screen w-8 z-50 touch-pan-y select-none"
                    onPointerDown={edge_onPointerDown}
                    onPointerMove={edge_onPointerMove}
                    onPointerUp={edge_onPointerUp}
                    onPointerCancel={edge_onPointerUp}
                    aria-hidden
                />
            )}
            {/* Mobile slide-in menu */}
            <div className={`sm:hidden fixed inset-0 z-40 ${isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
                <div
                    className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden
                />
                <div
                    className={`absolute top-0 left-0 h-full w-64 bg-secondary-background shadow-xl p-6 transition-transform duration-200 flex flex-col touch-pan-y select-none ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
                    role="dialog"
                    aria-modal="true"
                    onPointerDown={drawer_onPointerDown}
                    onPointerMove={drawer_onPointerMove}
                    onPointerUp={drawer_onPointerUp}
                    onPointerCancel={drawer_onPointerUp}
                >
                    <div className="mb-6 flex items-center justify-start">
                        <span className="pl-4 text-xl font-bold text-text-primary">ClutchCall</span>
                        <div className="flex-1" />
                        <Button variant="ghost" onClick={() => setIsMobileMenuOpen(false)} className="text-text-primary hover:text-primary hover:bg-secondary">
                            <X size={20} />
                        </Button>
                    </div>

                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${item.title === currentTitle ? "bg-secondary text-primary" : "text-text-primary hover:text-primary"}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <item.icon className="flex-shrink-0" />
                                <span className="whitespace-nowrap">{item.title}</span>
                            </Link>
                        ))}
                    </nav>
                    <div className="mt-auto flex justify-center pb-2">
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </div>
    )
}