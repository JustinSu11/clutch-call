"use client";
import { get } from 'http';
import React, { useState } from 'react';

// --- Main App Component ---

export default function PredictionsScreen() {
    // --- State Management ---
    // Example sports list - this would come from your backend
    const sports = ['All Sports', 'NFL', 'NBA', 'MLS'];
    
    // State to keep track of the currently selected sport filter
    const [activeSport, setActiveSport] = useState('NFL');

    // --- Sample Data ---
    // This is example data. In a real application, you would fetch this from your backend API
    // based on the `activeSport` filter.
    const predictionsData = {
        'NFL': [
            { id: 1, match: 'Lions vs. Tigers', prediction: 'Lions to win', confidence: 75, analysis: 'AI analysis suggests Lions have a strong offensive lineup and a solid defense.' },
            { id: 2, match: 'Bears vs. Wolves', prediction: 'Bears to win', confidence: 60, analysis: 'AI analysis indicates a close match, but Bears have a slight edge due to recent performance.' },
            { id: 3, match: 'Panthers vs. Jaguars', prediction: 'Panthers to win', confidence: 55, analysis: 'AI analysis predicts a tight game, with Panthers having a marginal advantage.' },
            { id: 4, match: 'Rams vs. Colts', prediction: 'Rams to win', confidence: 70, analysis: 'AI analysis highlights Rams\' consistent performance and strong team dynamics.' },
        ],
        'NBA': [
            { id: 5, match: 'Warriors vs. Lakers', prediction: 'Warriors to win', confidence: 85, analysis: 'AI points to Warriors\' superior three-point shooting as a key factor.' },
            { id: 6, match: 'Nets vs. Bucks', prediction: 'Bucks to win', confidence: 65, analysis: 'AI suggests Bucks\' dominant interior presence will be the deciding factor.' },
            { id: 7, match: 'Celtics vs. Heat', prediction: 'Celtics to win', confidence: 50, analysis: 'AI analysis indicates a very balanced matchup with no clear favorite.' },
            { id: 8, match: 'Suns vs. Clippers', prediction: 'Suns to win', confidence: 72, analysis: 'AI highlights Suns\' fast-paced offense and strong perimeter defense.' },
            { id: 9, match: 'Knicks vs. Raptors', prediction: 'Raptors to win', confidence: 58, analysis: 'AI analysis shows Raptors\' depth and versatility as key advantages.' },
        ],
        'MLS': [
            { id: 10, match: 'United vs. City', prediction: 'City to win', confidence: 78, analysis: 'AI highlights City\'s strong midfield control and recent form.' },
        ],
        'All Sports': [], // This could aggregate all sports or show featured matches
    };

    // Dynamically get the predictions for the currently active sport
    // If 'All Sports' is selected, we'll flatten all predictions into one list.
    const currentPredictions = activeSport === 'All Sports' 
        ? Object.values(predictionsData).flat().filter(p => p.id) // Filter out the empty 'All Sports' array
        : predictionsData[activeSport] || [];


// --- Helper Functions ---

// Determines a blended color for the confidence bar
const getConfidenceStyle = (confidence) => {
  // Clamp the confidence value between 0 and 100
  const clampedConfidence = Math.max(0, Math.min(100, confidence));

  // Map the percentage (0-100) to a hue value on the red-to-green spectrum (0-100)
  const hue = (clampedConfidence / 100) * 100;
  
  // Return an object suitable for an inline style prop in React
  return { 
    backgroundColor: `hsl(${hue}, 90%, 45%)` 
  };``
};

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            {/* Header Navigation */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-8">
                            <h1 className="text-2xl font-bold text-gray-800">ClutchCall</h1>
                            <nav className="hidden md:flex space-x-8">
                                <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
                                <a href="#" className="text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-1">Predictions</a>
                                <a href="#" className="text-gray-600 hover:text-gray-900">Insights</a>
                                <a href="#" className="text-gray-600 hover:text-gray-900">Community</a>
                            </nav>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Match Predictions</h2>
                    <p className="text-gray-600 mt-1">AI-powered predictions for upcoming sports matches.</p>
                </div>

                {/* Sports Filter Buttons - Dynamically Generated */}
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

                {/* Predictions Table */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prediction</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Analysis</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {/* This is where the dynamic list is rendered */}
                                {currentPredictions.length > 0 ? (
                                    currentPredictions.map((item) => (
                                        <tr key={item.id}>
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
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-10 text-gray-500">
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

