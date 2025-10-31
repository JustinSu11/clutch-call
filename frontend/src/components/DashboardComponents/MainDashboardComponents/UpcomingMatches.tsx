/*
    File: src/components/DashboardComponents/UpcomingMatches.tsx
    Created: 09/19/2025 
    Author: CJ Quintero

    Last Updated: 10/31/2025 by CJ Quintero

    Description: This file has the code for the upcoming matches component in the dashboard.
    For future development, this component will fetch and display real upcoming matches using 
    match cards.
*/

export default function UpcomingMatches() {
    return (
        <div>
            <div className="px-4 sm:px-0">
            {/* Upcoming Matches Section */}
            <section>
                <h2 className="flex justify-center text-2xl sm:text-3xl font-bold text-text-primary mb-4">Upcoming Matches</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Match cards go here */}
                    {/* Placeholder for empty state */}
                    <div className="col-span-full text-center py-8 text-text-secondary">
                        <div className="text-lg mb-2">No upcoming matches</div>
                        <div className="text-sm">Check back later for new matches</div>
                    </div>
                </div>
            </section>
            </div>
        </div>
    )
}

