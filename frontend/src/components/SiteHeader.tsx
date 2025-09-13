/*
Author: Justin Nguyen
Last updated: 09/09/2025
Purpose: Header component for the site, includes navigation links and branding
*/

import { Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SiteHeader() {
    return (
                <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto flex items-center justify-between gap-6 px-6 py-4">
                <a className="inline-flex items-center gap-2" href="#" aria-label="ClutchCall home">
                    {/*<Square className="h-8 w-8 text-red-500" fill="currentColor" />*/} {/*Logo will replace this*/}
                    <span className="text-2xl font-bold tracking-tight">ClutchCall</span>
                </a>
                <nav className="hidden items-center gap-8 md:flex">
                    <a className="text-sm font-medium text-zin-800 hover:text-red-600 transition-colors" href="#predictions">Predictions</a>
                    <a className="text-sm font-medium text-zin-800 hover:text-red-600 transition-colors" href="#how-it-works">How it works</a>
                </nav>
                <div flex-items-center gap-3>
                    <Button className="h-10 px-5 bg-red-500 hover:bg-red-600 text-white">
                        {/* Link to dashboard page */}
                        <Link href="/dashboard">Try Now</Link>
                    </Button>
                </div>
            </div>
        </header>
    )
}