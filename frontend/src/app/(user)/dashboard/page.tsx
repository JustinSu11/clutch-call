/*
    File: src/app/dashboard/page.tsx 
    Author: CJ Quintero
    Last Updated: 09/19/2025 by CJ Quintero

    Description:
    This file contains the content for the dashboard home page.
    In the link, this is /dashboard and is the default dashboard page

    When users navigate to a tab under the sidebar, such as /dashboard/predictions,
    they will be directed to a different page file, but the layout.tsx file will remain the same.
    The new page is physically located under /dashboard/predictions/page.tsx
*/
'use client'
import UpcomingMatches from "@/components/DashboardComponents/UpcomingMatches";
import RecentPredictions from "@/components/DashboardComponents/RecentPredictions";
import { useState } from 'react'
import SportsFilterDropdown from "@/components/DashboardComponents/SportsFilterDropdown"



export default function DashboardMain() {
    const [selectedLeagues, setSelectedLeagues] = useState<string[]>([])

    function handleLeagueSelection(key: string) {
        setSelectedLeagues((prev: string[]) =>
            prev.includes(key) 
                ? prev.filter((league) => league !== key) // remove league from selectedleagues array
                : [...prev, key] // add league to selectedLeagues array
        )
    } 

    return (
        <>
            <div className="mb-8">
                    <div className="flex text-3xl font-bold text-text-primary mb-4 items-center">
                        Dashboard
                        <SportsFilterDropdown handleLeagueSelection={handleLeagueSelection} selectedLeagues={selectedLeagues} />
                    </div>
            </div>
            <UpcomingMatches />
            <RecentPredictions />
        </>
    );
}