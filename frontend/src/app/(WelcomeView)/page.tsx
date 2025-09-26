/* 
Author: Justin Nguyen
Last Updated: 09/16/2025 by CJ Quintero
Purpose: Landing page for ClutchCall, explaining what it is and its features
*/

import * as React from 'react'
import WelcomeHero from "@/components/WelcomeViewComponents/WelcomeHero"
import WhyChooseSection from '@/components/WelcomeViewComponents/WhyChooseSection'
import CallToActionSection from '@/components/WelcomeViewComponents/CallToActionSection'
import SiteHeader from '@/components/WelcomeViewComponents/SiteHeader';
import SiteFooter from '@/components/WelcomeViewComponents/SiteFooter';


export default function WelcomeView() 
{
  return (
    <>
      <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900">
          <main className="flex-1">
              <SiteHeader />
              <WelcomeHero />
              <WhyChooseSection />
              <CallToActionSection />
              <SiteFooter />
          </main>
      </div>
    </>
  );
}