/*
    File: RecentPredictions.tsx
    Author: CJ Quintero
    Last Updated: 09/19/2025 by CJ Quintero

    Description:
    This file has the code for the recent predictions component in the dashboard home page.
*/

export default function RecentPredictions() {
    return (
        <>
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
        </>
    );
}
