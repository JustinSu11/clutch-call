/*
    File: src/app/dashboard/layout.tsx 
    Created: 09/16/2025 
    Author: CJ Quintero

    Last Updated: 09/16/2025 by CJ Quintero

    Description: This file defines the layout for the all pages under /dashboard.
    They will share a common layout that includes a sidebar and main content area.

*/

import type { Metadata } from 'next'
import Sidebar from '@/components/DashboardComponents/MainDashboardComponents/Sidebar'
import UpcomingMatches from '@/components/DashboardComponents/MainDashboardComponents/UpcomingMatches'

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
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
      <div className="flex h-full grow">
        {/* All pages under /dashboard will have this sidebar */}
        <Sidebar />
        {/* Main Content Area */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}