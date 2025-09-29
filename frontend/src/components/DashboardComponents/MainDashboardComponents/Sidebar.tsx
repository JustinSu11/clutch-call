/*
    File: src/components/DashboardComponents/Sidebar.tsx
    Created: 09/19/2025 
    Author: CJ Quintero

    Last Updated: 09/26/2025 by Justin Nguyen

    Description: This file has the code for the sidebar component in the dashboard.
*/

import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { Home } from "lucide-react"

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
                        {/* Each <a> tag is a link in the sidebar.
                            The href="#" is used as a placeholder that doesn't link to an actual page, it
                            just takes you back to the top of the page.
                        */}
                        <a className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary text-primary font-medium" href="#">
                            {/* <svg> is used to insert an inline SVG icon. This one displays a house for the Home tab on the sidebar*/}
                            <Home />
                            {/* The text label for the tab */}
                            <span>Home</span>
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


