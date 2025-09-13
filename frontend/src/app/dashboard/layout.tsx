/*
    Created by: CJ Quintero
    Last updated: 09/13/2025

    Layout file for the dashboard section
*/

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - ClutchCall',
  description: 'Your ClutchCall dashboard for sports predictions',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
          <div className="flex h-full grow">
            {/* Sidebar */}
            <aside className="flex flex-col w-64 bg-white p-6 border-r border-gray-200">
              <div className="flex flex-col h-full">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">ClutchCall</h1>
                <nav className="flex flex-col gap-2">
                  <a className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-100 text-red-500 font-medium" href="#">
                    <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z"></path>
                    </svg>
                    <span>Home</span>
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
      </body>
    </html>
  )
}