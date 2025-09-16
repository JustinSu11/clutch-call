/*
    File: src/app/layout.tsx 
    Created: 09/16/2025 
    Author: CJ Quintero

    Last Updated: 09/16/2025 by CJ Quintero

    Description: This file defines the root layout that is used for all pages (aka routes aka views)
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
                For a specific page, we want to setup its components based on that page's layout 
                This means use all the children components of that page's layout to format that
                specific page
            */}
            {children}
        </body>
    </html>
  );
}