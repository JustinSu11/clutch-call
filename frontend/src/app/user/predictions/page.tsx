/*
    File: frontend/src/app/predictions/page.tsx
    Created: 09/29/2025 by Michael Tajchman
    Last Updated: 09/29/2025 by Michael Tajchman

    Description: This file contains the main React component for the Predictions screen of the ClutchCall web application.
    It includes a header with navigation, a filterable list of sports, and a table displaying AI-powered match predictions.
*/
"use client";
import React, { useState, } from 'react';
import { parseUpcomingNFLGames } from '@/utils/nfl_parser';

// declare data types
type SportKey = 'All Sports' | 'NFL' | 'NBA' | 'MLS';

type Game = {
    homeTeam: string;
    awayTeam: string;
};

type Prediction = {
    id: number;
    match: string;
    prediction: string;
    confidence: number;
    analysis: string;
};

const getConfidenceStyle = (confidence: number) => {
    /* 
       getConfidenceStyle:
       This function returns a style object for the confidence bar based on the confidence percentage.
       The color transitions from red (0%) to green (100%) using HSL color space.

       params:
       confidence: number - a number between 0 and 100

       returns:
       a style object with backgroundColor property
    */ 

    const clampedConfidence = Math.max(0, Math.min(100, confidence));
    const hue = (clampedConfidence / 100) * 100;
    return { backgroundColor: `hsl(${hue}, 90%, 45%)` };
};

// --- Components ---
const SportsFilter: React.FC<{
    /*
    SportsFilter:
    This component renders a horizontal list of sports as filter buttons.

    params:
    sports: an array of sport keys (e.g., ['All Sports', 'NFL', 'NBA', 'MLS']) to select from
    activeSport: the currently selected sport key on the filter
    setActiveSport: a function to update the activeSport state when a sport is selected

    returns:
    a horizontal list of buttons for each sport, highlighting the active sport
    */
    sports: SportKey[];
    activeSport: SportKey;
    setActiveSport: (sport: SportKey) => void;
}> = ({ sports, activeSport, setActiveSport }) => (
    <div className="flex space-x-2 border-b border-gray-200 pb-4 mb-8 overflow-x-auto">
        {sports.map((sport) => (
            <button
                key={sport}
                onClick={() => setActiveSport(sport)}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                    activeSport === sport
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
                {sport}
            </button>
        ))}
    </div>
);

const PredictionRow: React.FC<{ item: Prediction }> = ({ item }) => (
    /*
        PredictionRow:
        This component renders a single row in the predictions table.

        params:
        item: a Prediction object containing id, match, prediction, confidence, and analysis

        returns:
        a table row displaying the prediction details, including a confidence bar
    */
    <tr>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">{item.match}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-800">{item.prediction}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-3">
                    <div
                        className="h-2.5 rounded-full"
                        style={{ ...getConfidenceStyle(item.confidence), width: `${item.confidence}%` }}
                    ></div>
                </div>
                <span className="text-sm font-medium text-gray-800">{item.confidence}%</span>
            </div>
        </td>
        <td className="px-6 py-4">
            <div className="text-sm text-gray-600 max-w-xs break-words">{item.analysis}</div>
        </td>
    </tr>
);

// --- Main App Component ---
export default function PredictionsScreen() {
    const sports: SportKey[] = ['All Sports', 'NFL', 'NBA', 'MLS'];
    const [activeSport, setActiveSport] = useState<SportKey>('NFL');


    const predictionsData: Record<SportKey, Prediction[]> = {
        'NFL': [
            // ...sample data...
        ],
        'NBA': [
            // ...sample data...
        ],
        'MLS': [
            // ...sample data...
        ],
        'All Sports': [],
    };

    const currentPredictions: Prediction[] = activeSport === 'All Sports'
        ? Object.values(predictionsData).flat().filter((p): p is Prediction => !!p && typeof p.id === 'number')
        : predictionsData[activeSport] || [];

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            {/* Header Navigation */}
            <header className="bg-white shadow-sm">
                {/* ...header code... */}
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Match Predictions</h2>
                    <p className="text-gray-600 mt-1">AI-powered predictions for upcoming sports matches.</p>
                </div>
                <SportsFilter sports={sports} activeSport={activeSport} setActiveSport={setActiveSport} />
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prediction</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Analysis</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentPredictions.length > 0 ? (
                                    currentPredictions.map((item) => (
                                        <PredictionRow key={item.id} item={item} />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-gray-500">
                                            No predictions available for {activeSport}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}