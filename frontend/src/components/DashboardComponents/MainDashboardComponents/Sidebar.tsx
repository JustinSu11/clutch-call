/*
    File: src/components/DashboardComponents/Sidebar.tsx
    Created: 09/19/2025 
    Author: CJ Quintero

    Last Updated: 10/01/2025 by CJ Quintero

    Description: This file has the code for the sidebar component in the dashboard.
*/

import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { Home, Target } from "lucide-react"

export default function Sidebar() {
    /*
        Sidebar()

        This component renders the sidebar for the dashboard layout.

        Returns:
        A JSX element representing the sidebar component.
    */
    return (
        <div>
            {/* <aside> defines a secondary component like sidebars. It's considered secondary content for the page*/}
            <aside className="sticky flex flex-col w-64 h-[100vh] bg-secondary-background p-6">
                <div className="flex flex-col h-full">
                    {/* The header for the sidebar */}
                    <h1 className="flex justify-center text-4xl font-bold text-text-primary mb-8">ClutchCall</h1>
                    {/* <nav> groups links together */}
                    <nav className="flex flex-col gap-2">
                        <a className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary text-primary font-medium" href="/user/dashboard">
                            <Home />
                            {/* The text label for the tab */}
                            <span>Home</span>
                        </a>
                        <a className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary text-primary font-medium" href="/user/predictions">
                            <Target />
                            <span>Predictions</span>
                        </a>
                    </nav>
                </div>
                <div className="mx-auto">
                    <ThemeToggle />
                </div>
                
            </aside>
        </div>
    )
}


