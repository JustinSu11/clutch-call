import { Button } from "@/components/ui/button"
import * as React from "react"

export default function WelcomeHero() {
    const heroImageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuDF9gNLdLbOBcWbtzRdA4OMoJAPM2XPueV49MT-VN3xhnbe-FVNY-SwwQa0qkvTUFVyLBrTsD_aCGb8YnS2MkTZQEZ9ssgTE0tal2kSdBsDoyGj4HATU-rcQs6s1Xzxy325smaSO7cHI4nN1JkCtwy4WzvBBjk2WZMz6SM3TH5wIMzL5gkC24mPZvMVfKlCEKeocV6FFzgueA8C711c0c0zshvOMs7EPjy0dcxSq16ZyY6qQZzzJJVt9uM-fgzuUYoSkYv1OIHepvp_";


    return (
        //classNames are tailwindcss utility classes, see https://tailwindcss.com/docs/styling-with-utility-classes for reference
        <section className="relative min-h-[60vh] isolate flex items-center justify-center overflow-hidden" aria-labelledby="hero-heading">
            {/* Background image start */}
            <div className="absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: `url(${heroImageUrl})`}}/>
            {/* Background image end */}
            {/* Overlay start */}
            <div className="absolute inset-0 -z-10 bg-black/60"/>
            {/* Overlay end */}
            <div className="container mx-auto px-6 text-center text-white py-20">
                <h1 id="hero-heading" className="text-4xl md:text-6xl font-extrabold tracking-tight">
                    AI-Powered Sports Predictions
                </h1>
                <p className="mt-4 mx-auto max-w-2xl text-lg md:text-xl/relaxed text-white/90">
                    ClutchCall uses AI to predict sports match outcomes, giving you an edge in understanding game dynamics and potential results.
                </p>
                <div className="mt-8 flex justify-center">
                    <Button size="lg" className="h-14 px-8 bg-red-500 hover:bg-red-600 cursor-pointer">
                        Explore Predictions
                    </Button>
                </div>
            </div>
        </section>
    )
}