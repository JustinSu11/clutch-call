/*
    File: src/components/DashboardComponents/UpcomingMatches.tsx
    Created: 09/19/2025 
    Author: CJ Quintero

    Last Updated: 09/19/2025 by CJ Quintero

    Description: This file has the code for the upcoming matches component in the dashboard.
    For future development, this component will fetch and display real upcoming matches using 
    match cards.
*/

export default function UpcomingMatches() {

    return (
        <div>
            {/* Upcoming Matches Section */}
            <section>
                <h2 className="text-3xl font-bold text-text-primary mb-4">Upcoming Matches</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Match cards go here */}
                </div>
            </section>
        </div>
    )
}

