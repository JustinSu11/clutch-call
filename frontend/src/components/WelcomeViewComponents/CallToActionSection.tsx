/*
Author: Justin Nguyen
Last updated: 09/08/2025
Purpose: Call to action section prompting users to try the app
*/

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CallToActionSection() {
    return (
        <section className="py-20 bg-secondary-background">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                    Ready to Elevate Your Game?
                </h2>
                <p className="mx-auto mb-8 max-w-3xl text-lg text-text-secondary">
                    Try ClutchCall today and start making informed decisions with out AI-powered predictions.
                </p>
                <Link href="user/dashboard">
                    <Button size="lg" className="h-14 px-8 bg-red-500 hover:bg-red-600 text-white">
                        Try now
                    </Button>
                </Link>
            </div>
        </section>
    )
}