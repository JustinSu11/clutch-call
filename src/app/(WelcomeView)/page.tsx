import * as React from 'react'
import WelcomeHero from "@/components/WelcomeHero"
import WhyChooseSection from '@/components/WhyChooseSection'
import CallToActionSection from '@/components/CallToActionSection'

//Landing page for ClutchCall, explaining what it is and its features

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900">
        <main className="flex-1">
            <WelcomeHero />
            <WhyChooseSection />
            <CallToActionSection />
        </main>
    </div>
  );
}