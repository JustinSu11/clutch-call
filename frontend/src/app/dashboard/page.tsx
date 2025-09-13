/*
    Created by: CJ Quintero
    Last updated: 09/13/2025

    This file contains the main method for the dashboard page
*/

export default function Dashboard() {
  return (
    <>
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
    </>
  );
}