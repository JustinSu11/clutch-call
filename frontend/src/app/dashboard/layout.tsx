/*
    File: src/app/dashboard/layout.tsx 
    Created: 09/16/2025 
    Author: CJ Quintero

    Last Updated: 09/16/2025 by CJ Quintero

    Description: This file defines the layout for the dashboard page

*/

import type { Metadata } from 'next'

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

        {/* Sidebar */}
        <aside className="flex flex-col w-64 bg-white p-6 border-r border-gray-200">
          <div className="flex flex-col h-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">ClutchCall</h1>
            <nav className="flex flex-col gap-2">
              <a className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-100 text-red-500 font-medium" href="/dashboard">
                <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z"></path>
                </svg>
                  <span>Home</span>
              </a>
              <a className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors" href="/dashboard/today">
                <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-96-88v64a8,8,0,0,1-16,0V132.94l-4.42,2.22a8,8,0,0,1-7.16-14.32l16-8A8,8,0,0,1,112,120Zm59.16,30.45L152,176h16a8,8,0,0,1,0,16H136a8,8,0,0,1-6.4-12.8l28.78-38.37A8,8,0,1,0,145.07,132a8,8,0,1,1-13.85-8A24,24,0,0,1,176,140,23.76,23.76,0,0,1,171.16,150.45Z"></path>
                </svg>
                <span>Today's Games</span>
              </a>
            </nav>
          </div>
        </aside>

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