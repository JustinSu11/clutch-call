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
import UpcomingMatches from "@/components/DashboardComponents/MainDashboardComponents/UpcomingMatches";
import RecentPredictions from "@/components/DashboardComponents/MainDashboardComponents/RecentPredictions";


export default function DashboardMain() {
  return (
    <>
      <UpcomingMatches />
      <RecentPredictions />

      {/* Stats Section */}
      <section className="mt-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-base font-medium text-gray-600">Total Predictions</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">150</p>
          </div>
          {/* Add other stat cards */}
        </div>
      </section>
    </>
  );
}