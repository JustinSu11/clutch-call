/*
    Created by: CJ Quintero
    Last updated: 09/13/2025

    This file contains the main method for the dashboard page
*/

export default function Dashboard() {
  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
      <div className="flex h-full grow">
        {/* Sidebar */}
        <aside className="flex flex-col w-64 bg-white p-6 border-r border-gray-200">
          <div className="flex flex-col h-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">ClutchCall</h1>
            <nav className="flex flex-col gap-2">
              <a className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-100 text-red-500 font-medium" href="#">
                <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z"></path>
                </svg>
                <span>Home</span>
              </a>
              {/* Add other navigation items */}
            </nav>
            <div className="mt-auto">
              <button className="w-full flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-red-500 text-white text-base font-bold leading-normal tracking-wide shadow-md hover:bg-red-600 transition">
                <span className="truncate">Upgrade to Pro</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Welcome back, Alex</h1>
            
            {/* Upcoming Matches Section */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Upcoming Matches</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Match cards */}
              </div>
            </section>

            {/* Recent Predictions Section */}
            <section className="mt-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Recent Predictions</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Match</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Prediction</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Result</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Table rows */}
                  </tbody>
                </table>
              </div>
            </section>

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
          </div>
        </main>
      </div>
    </div>
  );
}