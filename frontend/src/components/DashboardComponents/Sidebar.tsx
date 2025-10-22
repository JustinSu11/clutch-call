/*
    File: src/components/DashboardComponents/Sidebar.tsx
    Created: 09/19/2025 
    Author: CJ Quintero

    Last Updated: 10/13/2025 by CJ Quintero

    Description: This file has the code for the sidebar component in the dashboard.
*/
"use client"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { Home, ChartScatter, AlignJustify, X, Trophy, Award } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
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

    //This is used in the className for the links that get generated for each nav item. if currentTitle (title of the nav item whose href matches the path in the url) matches with the title of the nav item then that nav item will have classes applied to it that make it look like its selected
    const pathname = usePathname()
    const currentTitle = navItems.find(item => pathname?.startsWith(item.href))?.title

    const [isSideBarOpen, setIsSideBarOpen] = useState(false)

    function handleSideBarOpenClose() {
        setIsSideBarOpen(!isSideBarOpen)
    }

    return (
        <div>
            <aside className={`sticky top-0 self-start flex flex-col ${isSideBarOpen ? "w-64" : "w-16"} h-[100vh] bg-secondary-background py-6 px-1 transition-[width] duration-300 ease-in-out overflow-hidden`}>
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
                    {/* <nav> groups links together */}
                    <nav className="flex flex-col gap-2">
                        {
                            navItems.map((item) => (
                                <Link className={` flex items-center gap-3 px-4 py-3 rounded-lg text-text-primary font-medium hover:text-primary  ${item.title === currentTitle ? "bg-secondary text-primary" : "text-text-primary"} `} href={item.href} id={item.title} key={item.title}>
                                    <item.icon className="flex-shrink-0 transition-transform duration-200" />
                                    {/*label for the nav item*/}
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
        </div>
    )
}


