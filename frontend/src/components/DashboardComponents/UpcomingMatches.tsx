/*
    File: src/components/DashboardComponents/UpcomingMatches.tsx
    Created: 09/19/2025 
    Author: CJ Quintero

    Last Updated: 11/04/2025 by Justin Nguyen

    Description: This file has the code for the upcoming matches component in the dashboard.
    For future development, this component will fetch and display real upcoming matches using 
    match cards.
*/

import MatchCarousel from "./MatchCarousel"

export default function UpcomingMatches({ selectedLeagues }: { selectedLeagues: string[] }) {
    return (
        <div>
            <div className="px-4 sm:px-0">
            {/* Upcoming Matches Section */}
            <section>
                <h2 className="text-3xl font-bold text-text-primary mb-4">Upcoming Matches</h2>
                <div className="w-full">
                    <MatchCarousel selectedLeagues={selectedLeagues} />
                </div>
            </section>
            </div>
        </div>
    )
}

