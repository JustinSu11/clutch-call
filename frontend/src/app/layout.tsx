/*
    File: src/app/layout.tsx 
    Created: 09/16/2025 
    Author: CJ Quintero

    Last Updated: 09/16/2025 by CJ Quintero

    Description: This file defines the ROOT LAYOUT that is used for all pages (aka routes aka views)
    across the entire app. It includes global styles and sets up the top level HTML structure.

*/

// global imports are auto imported into every page 
import "@/styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Every page must be in HTML obviously
    <html lang="en">
        <body>
            {/* 
                Means to use the components for that specific page
                Ex) If on the WelcomeView page, it will use the WelcomeView components to build the page
            */}
            {children}
        </body>
    </html>
  );
}