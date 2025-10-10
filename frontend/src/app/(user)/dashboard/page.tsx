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
import UpcomingMatches from "@/components/DashboardComponents/UpcomingMatches";
import RecentPredictions from "@/components/DashboardComponents/RecentPredictions";
// import { useState } from 'react'
import SportsFilterDropdown from "@/components/DashboardComponents/SportsFilterDropdown"



export default function DashboardMain() {
    // const [selectedLeague, setSelectedLeague] = useState('')

    // function handleLeagueSelection(key: string) {
    //     setSelectedLeague(key)
    // }

    return (
        <>
            <div className="mb-8">
                    <div className="flex text-3xl font-bold text-text-primary mb-4 items-center">
                        Dashboard
                        <SportsFilterDropdown />
                    </div>
            </div>
            <UpcomingMatches />
            <RecentPredictions />
        </>
    );
}