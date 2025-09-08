/* 
<<<<<<< HEAD
Author: Justin Nguyen
Last Updated: 09/08/2025
Purpose: Landing page for ClutchCall, explaining what it is and its features
=======
    Author: Justin Nguyen
    Last Updated: 09/08/2025
    Purpose: Landing page for ClutchCall, explaining what it is and its features
>>>>>>> b08edd8cdd542ff6c1ece32354d53aab3ccbd453
*/

import * as React from 'react'
import WelcomeHero from "@/components/WelcomeHero"
import WhyChooseSection from '@/components/WhyChooseSection'
import CallToActionSection from '@/components/CallToActionSection'

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