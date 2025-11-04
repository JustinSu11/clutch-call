/*
    File: src/app/user/layout.tsx 
    Author: CJ Quintero

    Last Updated: 09/24/2025 by Justin Nguyen

    Description:
    This file defines the layout for all pages under /dashboard.
    They will share a common layout that includes a sidebar and main content area.
*/

import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import Sidebar from '@/components/DashboardComponents/MainDashboardComponents/Sidebar'

export const metadata: Metadata = {
  title: 'ClutchCall - Dashboard',
  description: 'Your ClutchCall dashboard for sports predictions',
  // icon goes here eventually
}

export async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
    //These two variables below allow the sidebar open/close state to persist across page reloads
    return (
        <div className="flex size-full min-h-screen flex-col group/design-root">
            <div className="flex h-full grow">
                {/* All pages under /dashboard will have this sidebar */}
                <Sidebar />
                {/* Main Content Area */}
                <main className="flex-1 p-8 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
  )
}

export default DashboardLayout