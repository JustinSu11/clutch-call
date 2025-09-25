/*
    File: src/app/dashboard/layout.tsx 
    Created: 09/16/2025 
    Author: CJ Quintero

    Last Updated: 09/24/2025 by Justin Nguyen

    Description: This file defines the layout for the dashboard page

*/

import { ThemeToggle } from '@/components/ui/ThemeToggle'
import type { Metadata } from 'next'
import { 
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar'
import { SideNavbar } from '@/components/SideNavbar'

export const metadata: Metadata = {
  title: 'ClutchCall - Dashboard',
  description: 'Your ClutchCall dashboard for sports predictions',
  // icon goes here eventually
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
        <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
        <div className="flex h-full grow">

            {/* Sidebar */}
            <aside className="flex flex-col w-64 bg-secondary-background p-6">
            <div className="flex flex-col h-full">
                <h1 className="text-2xl font-bold text-text-primary mb-8">ClutchCall</h1>
                <ThemeToggle />
                <nav className="flex flex-col gap-2">
                <a className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary text-red-500 font-medium" href="#">
                    <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z"></path>
                    </svg>
                    <span>Home</span>
                </a>
                </nav>
            </div>
            </aside>

            <SideNavbar />

            {/* Main Content Area */}
            <main className="flex-1 p-8">
                <SidebarTrigger />
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
            </main>
        </div>
        </div>
    </SidebarProvider>
  )
}