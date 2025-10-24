/*
    File: frontend/src/app/predictions/page.tsx
    Created: 09/29/2025 by Michael Tajchman
    Last Updated: 09/30/2025 by CJ Quintero

    Description: This file contains the main React component for the Predictions screen of the ClutchCall web application.
    It includes a header with navigation, a filterable list of sports, and a table displaying AI-powered match predictions.
*/
"use client";
import React, { useState, useEffect } from 'react';
import { parseUpcomingNFLGames } from '@/utils/nfl_parser';
import { parseUpcomingNBAGames } from '@/utils/nba_parser';
import { parseUpcomingMLSGames } from '@/utils/mls_parser';

// Import the method that calls your backend prediction API
import { getNFLPrediction } from '@/backend_methods/nfl_methods';


// declare data types
type SportKey = 'All Sports' | 'NFL' | 'NBA' | 'MLS';

type Game = {
    id: string; // Ensure the parsed game object includes an ID
    homeTeam: string;
    awayTeam: string;
    date? : Date;
};

type Prediction = {
    match: string;          // gets built from homeTeam and awayTeam
    prediction: string;     // the eventual prediction text
    confidence: number;     // a number between 0 and 100 showing how confident the AI prediction is
    analysis: string;       // the AI explanation for the prediction
    sport: SportKey;        // the sport this prediction belongs to used for filtering (NFL, NBA, MLS)
};

const buildNFLPredictions = async (): Promise<Prediction[]> => {
    /*
        buildNFLPredictions:
        This method builds a list of Prediction objects for upcoming NFL games
        by calling the AI backend for each game.
    */
    const upcomingNFLGames = await parseUpcomingNFLGames();

    // Ensure we only process games that have a valid ID string
    const validGames = upcomingNFLGames.filter(game => typeof game.id === 'string' && game.id.length > 0);

    // Map over the validGames array
    const predictionPromises = validGames.map(async (game) => {
        // We know game.id is a string here
        const aiPrediction = await getNFLPrediction(game.id);

        if (aiPrediction.error) {
            console.error(`Failed to get prediction for game ${game.id}:`, aiPrediction.error, aiPrediction.details);
            return null; // Return null if a specific prediction fails
        }

        // Make sure confidence is a number
        let confidenceValue = 0;
        if (aiPrediction.confidence) {
             confidenceValue = parseFloat(aiPrediction.confidence.replace('%', ''));
        }

        // Build the Prediction object with REAL data from your AI model
        return {
            match: `${game.awayTeam} at ${game.homeTeam}`,
            prediction: `Predicted Winner: ${aiPrediction.predicted_winner}`,
            confidence: isNaN(confidenceValue) ? 0 : confidenceValue, // Ensure it's a valid number
            analysis: `AI analysis based on team performance metrics.`,
            sport: 'NFL' as SportKey,
        };
    });

    // Wait for all the API calls to complete
    const predictions = await Promise.all(predictionPromises);

    // Filter out any games that failed to get a prediction
    return predictions.filter(p => p !== null) as Prediction[];
};


const buildMLSPredictions = async (): Promise<Prediction[]> => {
    /*
        buildMLSPredictions:
        This method builds a list of Prediction objects for upcoming MLS games.
    */
    const upcomingMLSGames = await parseUpcomingMLSGames();

    // map each game to a Prediction object
    return upcomingMLSGames.map((game) => ({
        match: `${game.awayTeam} at ${game.homeTeam}`,
        prediction: `${game.homeTeam} predicted to win`, // Placeholder
        confidence: 100, // Placeholder
        analysis: `Based on recent performance...`, // Placeholder
        sport: 'MLS'
    }));
}

const buildNBAPredictions = async (): Promise<Prediction[]> => {
    /*
        buildNBAPredictions:
        This method builds a list of Prediction objects for upcoming NBA games.
    */
    const upcomingNBAGames = await parseUpcomingNBAGames();

    // map each game to a Prediction object
    return upcomingNBAGames.map((game) => ({
        match: `${game.awayTeam} at ${game.homeTeam}`,
        prediction: `${game.homeTeam} predicted to win`, // Placeholder
        confidence: 100, // Placeholder
        analysis: `Based on recent performance...`, // Placeholder
        sport: 'NBA'
    }));
}

const getConfidenceStyle = (confidence: number) => {
    /* getConfidenceStyle:
        This function returns a style object for the confidence bar based on the confidence percentage.
    */
    const clampedConfidence = Math.max(0, Math.min(100, confidence));
    const hue = (clampedConfidence / 100) * 100; // Hue goes from 0 (red) to 100 (greenish)
    return { backgroundColor: `hsl(${hue}, 90%, 45%)` };
};


// --- Components ---
const SportsFilter: React.FC<{
    sports: SportKey[];
    activeSport: SportKey;
    setActiveSport: (sport: SportKey) => void;
}> = ({ sports, activeSport, setActiveSport }) => (
    <div className="text-text-primary mb-4">
        {sports.map((sport) => (
            <button
                key={sport}
                onClick={() => setActiveSport(sport)}
                className={`px-4 py-2 text-sm text-text-primary font-medium rounded-md whitespace-nowrap ${
                    activeSport === sport
                        ? 'bg-secondary text-text-primary'
                        : 'hover:text-primary'
                } cursor-pointer`}
            >
                {sport}
            </button>
        ))}
    </div>
);

const PredictionRow: React.FC<{ item: Prediction }> = ({ item }) => (
    <tr className="bg-secondary-background">
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-md font-medium text-text-primary">{item.match}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-md font-medium text-text-primary">{item.prediction}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-3">
                    <div
                        className="h-2.5 rounded-full"
                        style={{ ...getConfidenceStyle(item.confidence), width: `${item.confidence}%` }}
                    ></div>
                </div>
                <span className="text-md font-medium text-text-primary">{item.confidence.toFixed(0)}%</span> {/* Show confidence as integer */}
            </div>
        </td>
        <td className="px-6 py-4">
            <div className="text-md font-medium text-text-primary">{item.analysis}</div>
        </td>
    </tr>
);

// --- Main App Component ---
export default function PredictionsScreen() {
    const sports: SportKey[] = ['All Sports', 'NFL', 'NBA', 'MLS'];
    const [activeSport, setActiveSport] = useState<SportKey>('NFL');
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- UPDATED useEffect Hook ---
    useEffect(() => {
        setLoading(true);
        setError(null);

        // Define an async function inside useEffect to handle fetching
        const fetchAllPredictions = async () => {
            try {
                // Fetch predictions for all sports concurrently
                const results = await Promise.all([
                    buildNFLPredictions(),
                    // buildNBAPredictions(), // Still using placeholder
                    buildMLSPredictions(), // Still using placeholder
                ]);
                // Flatten the results array and update the state
                setPredictions(results.flat());
            } catch (err) {
                console.error("Error fetching predictions:", err);
                setError('Failed to fetch predictions');
            } finally {
                setLoading(false);
            }
        };

        fetchAllPredictions(); // Call the async function to fetch data

    }, []); // Empty dependency array ensures this runs once on mount
    // --- END UPDATED useEffect Hook ---

    const filteredPredictions = activeSport === 'All Sports'
    ? predictions
    : predictions.filter(p => p.sport === activeSport);

    return (
        <div className="overflow-x-auto">
            <header className="">
                {/* ...header code... */}
            </header>
            <main className="">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-text-primary mb-4">Predictions</h2>
                    <p className="text-text-primary mb-4">AI-powered predictions for upcoming sports matches.</p>
                </div>
                <SportsFilter sports={sports} activeSport={activeSport} setActiveSport={setActiveSport} />
                <div className= "rounded-lg overflow-hidden">
                    <div className="overflow-x-hidden">
                        <table className="min-w-full divide-y divide-secondary">
                            <thead className="bg-secondary-background rounded-xl shadow-sm">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">Match</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">Prediction</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">Confidence</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">AI Analysis</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-text-primary bg-secondary-background">
                                            Loading predictions...
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-text-primary bg-secondary-background">
                                            {error}
                                        </td>
                                    </tr>
                                ) : filteredPredictions.length > 0 ? (
                                    filteredPredictions.map((item, idx) => (
                                        <PredictionRow key={idx} item={item} />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-text-primary bg-secondary-background">
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