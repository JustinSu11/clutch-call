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
    </>
  );
}