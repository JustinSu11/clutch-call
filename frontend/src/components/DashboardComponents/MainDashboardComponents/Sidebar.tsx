/*
    File: src/components/DashboardComponents/Sidebar.tsx
    Created: 09/19/2025 
    Author: CJ Quintero

    Last Updated: 10/01/2025 by CJ Quintero

    Description: This file has the code for the sidebar component in the dashboard.
*/
"use client"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { Home, ChartScatter, AlignJustify } from "lucide-react"
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

    const [isSideBarOpen, setIsSideBarOpen] = useState(true)

    function handleSideBarOpenClose() {
        setIsSideBarOpen(!isSideBarOpen)
    }

    return (
        <div>
            {isSideBarOpen ? (
                // <aside> defines a secondary component like sidebars. It's considered secondary content for the page
                <aside className="sticky top-0 self-start flex flex-col w-64 h-[100vh] bg-secondary-background py-6 px-1">
                    <div className="flex flex-col h-full">
                        {/* The header for the sidebar */}
                        <div className="flex text-3xl font-bold text-text-primary">
                            <Button variant="ghost" className="mb-8 ml-1 text-text-primary hover:text-primary" onClick={() => handleSideBarOpenClose()}>
                                <AlignJustify size={24}/>
                            </Button>
                            ClutchCall
                        </div>
                        {/* <nav> groups links together */}
                        <nav className="flex flex-col gap-2">
                            {
                                navItems.map((item) => (
                                    <Link className={`flex items-center gap-3 px-4 py-3 rounded-lg text-text-primary font-medium hover:text-primary ${item.title === currentTitle ? "bg-secondary text-primary" : "text-text-primary"}`} href={item.href} id={item.title} key={item.title}>
                                        <item.icon />
                                        {/* The text label for the tab */}
                                        <span>{item.title}</span>
                                    </Link>
                                ))
                            }
                        </nav>
                    </div>
                    <div className="mx-auto">
                        <ThemeToggle />
                    </div>
                </aside>
            ) : (
                <aside className="sticky top-0 self-start flex flex-col w-16 h-[100vh] bg-secondary-background py-6 px-1">
                    <div className="flex flex-col h-full">
                        {/* The header for the sidebar */}
                        <Button variant="ghost" className="mb-8 text-text-primary hover:text-primary" onClick={() => handleSideBarOpenClose()}>
                            <AlignJustify size={24} />
                        </Button>
                        {/* <nav> groups links together */}
                        <nav className="flex flex-col gap-2">
                            {
                                navItems.map((item) => (
                                    <Link className={`flex items-center gap-3 px-4 py-3 rounded-lg text-text-primary font-medium hover:text-primary ${item.title === currentTitle ? "bg-secondary text-primary" : "text-text-primary"}`} href={item.href} id={item.title} key={item.title}>
                                        <item.icon />
                                    </Link>
                                ))
                            }
                        </nav>
                    </div>
                    <div className="mx-auto">
                        <ThemeToggle />
                    </div>
                </aside>
            )}
        </div>
    )
}


