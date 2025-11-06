/*
    File: frontend/src/app/predictions/page.tsx
    Created: 09/29/2025 by Michael Tajchman
    Last Updated: 09/30/2025 by CJ Quintero

    Description: This file contains the main React component for the Predictions screen of the ClutchCall web application.
    It includes a header with navigation, a filterable list of sports, and a table displaying AI-powered match predictions.
*/
"use client";
import React, { useState, useEffect } from 'react';
import { parseUpcomingNFLGames, parseTodayNFLGames, parseNFLGamesFromEvents } from '@/utils/nfl_parser';
import { parseUpcomingNBAGames } from '@/utils/nba_parser';
import { parseUpcomingMLSGames } from '@/utils/mls_parser';

// Import the method that calls your backend prediction API
import { getNFLPrediction, getHistoricalNFLGames } from '@/backend_methods/nfl_methods';



// declare data types
type SportKey = 'All Sports' | 'NFL' | 'NBA' | 'MLS';

type Game = {
    id: string; // Ensure the parsed game object includes an ID
    homeTeam: string;
    awayTeam: string;
    date?: string; // Formatted date string
    status?: {
        state?: string;
        type?: string;
    };
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
        This method builds a list of Prediction objects for NFL games
        by calling the AI backend for each game.
        Fetches upcoming, today's, and historical games to get in-progress/completed games.
    */
   
    console.log('🏈 Starting NFL predictions build...');
    
    // Fetch upcoming, today's, and historical games (last 2 days for completed games)
    let upcomingGames: Game[] = [];
    let todayGames: Game[] = [];
    let historicalGames: Game[] = [];
    
    try {
        console.log('📡 Fetching upcoming NFL games...');
        upcomingGames = await parseUpcomingNFLGames();
        console.log(`✅ Fetched ${upcomingGames.length} upcoming games`);
    } catch (error) {
        console.error('❌ Error fetching upcoming games:', error);
    }
    
    try {
        console.log('📡 Fetching today\'s NFL games...');
        todayGames = await parseTodayNFLGames();
        console.log(`✅ Fetched ${todayGames.length} today's games`);
    } catch (error) {
        console.error('❌ Error fetching today\'s games:', error);
    }
    
    // Fetch historical games from the last week to get completed games
    try {
        console.log('📡 Fetching historical NFL games (last 7 days)...');
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7); // Go back 7 days to find completed games
        
        const startDateStr = weekAgo.toISOString().split('T')[0]; // YYYY-MM-DD
        const endDateStr = today.toISOString().split('T')[0];
        
        console.log(`📅 Fetching games from ${startDateStr} to ${endDateStr}`);
        
        const historicalData = await getHistoricalNFLGames(startDateStr, endDateStr);
        console.log('📥 Raw historical games response:', historicalData);
        
        if (historicalData && historicalData.events && historicalData.events.length > 0) {
            console.log(`📋 Found ${historicalData.events.length} historical events`);
            
            // Filter for only completed games BEFORE parsing
            const completedEvents = historicalData.events.filter((event: any) => {
                const comp = event.competitions?.[0];
                const status = comp?.status || event.status || {};
                const statusType = status.type?.name?.toLowerCase() || '';
                const statusState = status.type?.state?.toLowerCase() || '';
                
                // Only include completed/finished games
                const isCompleted = statusState === 'post' || 
                                  statusType.includes('final') ||
                                  statusType.includes('finished') ||
                                  statusType.includes('complete') ||
                                  statusType === 'status_final' ||
                                  statusType === 'status_completed';
                
                if (isCompleted) {
                    console.log(`✅ Found completed game: ${event.id} - status: ${statusType} (${statusState})`);
                }
                
                return isCompleted;
            });
            
            console.log(`📊 Filtered to ${completedEvents.length} completed games out of ${historicalData.events.length} total`);
            
            if (completedEvents.length > 0) {
                historicalGames = parseNFLGamesFromEvents(completedEvents);
                console.log(`✅ Parsed ${historicalGames.length} completed historical games`);
            } else {
                console.log('⚠️ No completed games found in historical data');
            }
        } else {
            console.log('⚠️ No historical games found');
        }
    } catch (error) {
        console.error('❌ Error fetching historical games:', error);
    }

    // Combine games and remove duplicates by ID
    const allGamesMap = new Map<string, Game>();
    [...upcomingGames, ...todayGames, ...historicalGames].forEach(game => {
        if (game.id && !allGamesMap.has(game.id)) {
            allGamesMap.set(game.id, game);
        }
    });
    const allGames = Array.from(allGamesMap.values());

    // Ensure we only process games that have a valid ID string
    const validGames = allGames.filter(game => typeof game.id === 'string' && game.id.length > 0);

    console.log(`📊 Found ${validGames.length} total NFL games (${upcomingGames.length} upcoming, ${todayGames.length} today, ${historicalGames.length} historical)`);
    console.log('📋 All games with status:', validGames.map(g => ({
        id: g.id,
        match: `${g.awayTeam} @ ${g.homeTeam}`,
        statusState: g.status?.state,
        statusType: g.status?.type
    })));

    // Filter games by status - only predict in-progress or completed games
    // TEMPORARY: For debugging, let's be more lenient and see what we get
    const predictableGames = validGames.filter(game => {
        const statusState = game.status?.state?.toLowerCase() || 'unknown';
        const statusType = game.status?.type?.toLowerCase() || 'unknown';
        
        console.log(`🔍 Checking game ${game.id} (${game.awayTeam} @ ${game.homeTeam}): state="${statusState}", type="${statusType}"`);
        
        // Skip games that haven't started (pre/scheduled status)
        if (statusState === 'pre' || 
            statusType === 'scheduled' || 
            statusType === 'pre' ||
            statusType === 'status_scheduled' ||
            statusType.includes('scheduled')) {
            console.log(`❌ Skipping game ${game.id} - status: state="${statusState}", type="${statusType}" (game hasn't started yet)`);
            return false;
        }
        
        // Include games that are in-progress or completed
        // Status states: "in" (in-progress), "post" (completed), etc.
        // Status types: "in-progress", "final", "finished", "status_in_progress", "status_final", etc.
        // Also check for completed games by looking for status that indicates game ended
        const isPlayable = statusState === 'in' || 
                          statusState === 'post' ||
                          statusType.includes('in-progress') ||
                          statusType.includes('in_progress') ||
                          statusType.includes('final') ||
                          statusType.includes('finished') ||
                          statusType.includes('live') ||
                          statusType.includes('complete') ||
                          statusType.includes('closed') ||
                          statusType === 'status_final' ||
                          statusType === 'status_completed' ||
                          (statusState === 'post' && statusType !== 'unknown'); // If state is post, it's completed
        
        if (isPlayable) {
            console.log(`✅ Including game ${game.id} (${game.awayTeam} @ ${game.homeTeam}) - status: state="${statusState}", type="${statusType}"`);
        } else {
            console.log(`⚠️ Excluding game ${game.id} - status doesn't match playable criteria: state="${statusState}", type="${statusType}"`);
            // Log the full status object for debugging
            console.log(`   Full status object:`, game.status);
        }
        
        return isPlayable;
    });

    console.log(`Found ${predictableGames.length} games eligible for prediction out of ${validGames.length} total games`);

    if (predictableGames.length === 0) {
        console.log('⚠️ No games in progress or completed. Predictions require games that have started.');
        console.log('📋 All game statuses for debugging:', validGames.map(g => ({
            id: g.id,
            match: `${g.awayTeam} @ ${g.homeTeam}`,
            statusState: g.status?.state,
            statusType: g.status?.type,
            fullStatus: g.status
        })));
        
        // TEMPORARY TEST: Try to get predictions for ANY game that's not explicitly "pre" to test if model works
        // This will help us see if the issue is with filtering or with the model itself
        console.log('🧪 TESTING: Attempting to get prediction for first available game (even if status is unknown)...');
        if (validGames.length > 0) {
            const testGame = validGames[0];
            console.log(`🧪 Testing with game ${testGame.id} (${testGame.awayTeam} @ ${testGame.homeTeam})`);
            try {
                const testPrediction = await getNFLPrediction(testGame.id);
                console.log('🧪 Test prediction result:', testPrediction);
            } catch (error) {
                console.error('🧪 Test prediction error:', error);
            }
        }
        
        // TEMPORARY: If no predictable games, try to get predictions for any game that's not explicitly "pre"
        // This helps debug if the status filtering is too strict
        const fallbackGames = validGames.filter(game => {
            const statusState = game.status?.state?.toLowerCase() || 'unknown';
            const statusType = game.status?.type?.toLowerCase() || 'unknown';
            // Only exclude if explicitly "pre" or "scheduled"
            return !(statusState === 'pre' && statusType.includes('scheduled'));
        });
        
        if (fallbackGames.length > 0 && fallbackGames.length !== validGames.length) {
            console.log(`🔄 Trying fallback: ${fallbackGames.length} games (excluding only explicitly pre-game)`);
            // Use fallback games but continue with normal flow
            // We'll set predictableGames to fallbackGames for this attempt
            const originalPredictable = predictableGames;
            // For now, just log - we'll try the fallback approach
        }
        
        return [];
    }

    // Map over the predictableGames array (only games that have started)
    console.log(`🔄 Starting prediction requests for ${predictableGames.length} games...`);
    const predictionPromises = predictableGames.map(async (game) => {
        try {
            console.log(`📞 Requesting prediction for game ${game.id} (${game.awayTeam} @ ${game.homeTeam})...`);
            // We know game.id is a string here
            const aiPrediction = await getNFLPrediction(game.id);
            console.log(`📥 Received response for game ${game.id}:`, aiPrediction);

            if (aiPrediction.error) {
                // Handle 422 errors gracefully (expected for games that just started or have insufficient data)
                const errorMsg = aiPrediction.error?.toString() || '';
                if (errorMsg.includes('Cannot predict upcoming games') || 
                    errorMsg.includes('Insufficient game data') ||
                    errorMsg.includes('422')) {
                    console.log(`⚠️ Game ${game.id} cannot be predicted yet (expected):`, aiPrediction.error);
                    return null;
                }
                console.error(`❌ Failed to get prediction for game ${game.id}:`, aiPrediction.error, aiPrediction.details);
                return null;
            }

            // Make sure confidence is a number
            let confidenceValue = 0;
            if (aiPrediction.confidence) {
                confidenceValue = typeof aiPrediction.confidence === 'string' 
                ? parseFloat(aiPrediction.confidence.replace('%', ''))
                : aiPrediction.confidence;
            }

            // Build the Prediction object with REAL data from your AI model
            const predictedWinner = aiPrediction.predicted_winner || 'unknown';
            const winnerName = predictedWinner === 'home' ? game.homeTeam : 
                             predictedWinner === 'away' ? game.awayTeam : 
                             'Unknown';
            
            // Use decision_factors if available, otherwise fall back to basic message
            const decisionFactors = aiPrediction.decision_factors || {};
            let analysisText = '';
            
            if (Object.keys(decisionFactors).length > 0) {
                // Sort factors by absolute contribution (most influential first)
                const sortedFactors = Object.entries(decisionFactors)
                    .map(([feature, data]: [string, any]) => ({
                        feature,
                        ...data,
                        absContribution: Math.abs(data.contribution)
                    }))
                    .sort((a, b) => b.absContribution - a.absContribution);
                
                // Build analysis from top decision factors - cleaner format
                const topFactors = sortedFactors.slice(0, 2); // Top 2 most influential
                
                const factors = topFactors.map((factor) => {
                    const featureName = factor.feature === 'HomeYards' ? 'Home yards' :
                                      factor.feature === 'AwayYards' ? 'Away yards' :
                                      'Yard differential';
                    // Use actual team names instead of "home" or "away"
                    const teamName = factor.contribution > 0 ? game.homeTeam : game.awayTeam;
                    return `${featureName} (${factor.value}) favors ${teamName}`;
                });
                
                analysisText = factors.join(', ');
            } else {
                // Fallback if decision_factors not available
                analysisText = 'AI analysis based on team performance metrics.';
            }
            
            const prediction = {
                match: `${game.awayTeam} at ${game.homeTeam}`,
                prediction: winnerName + ' to win',
                confidence: isNaN(confidenceValue) ? 0 : confidenceValue,
                analysis: analysisText,
                sport: 'NFL' as SportKey,
            };
            
            console.log(`✅ Successfully built prediction for game ${game.id}:`, prediction);
            return prediction;
        } catch (error: any) {
            // Handle network errors or 422 errors in the catch block
            const errorMessage = error?.message || '';
            console.error(`💥 Exception for game ${game.id}:`, error);
            if (errorMessage.includes('422') || 
                errorMessage.includes('Cannot predict upcoming games') ||
                errorMessage.includes('Insufficient game data')) {
                console.log(`⚠️ Game ${game.id} cannot be predicted yet (caught error):`, errorMessage);
                return null;
            }
            console.error(`❌ Error fetching prediction for game ${game.id}:`, error);
            return null;
        }
    });

    // Wait for all the API calls to complete
    console.log('⏳ Waiting for all prediction requests to complete...');
    const predictions = await Promise.all(predictionPromises);

    // Filter out any games that failed to get a prediction
    const filteredPredictions = predictions.filter(p => p !== null) as Prediction[];
    console.log(`📈 Final results: ${filteredPredictions.length} successful predictions out of ${predictableGames.length} eligible games`);
    console.log('✅ Predictions:', filteredPredictions);
    
    if (filteredPredictions.length === 0 && predictableGames.length > 0) {
        console.warn('⚠️ WARNING: Had eligible games but no successful predictions. Check backend logs for errors.');
    }
    
    return filteredPredictions;
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
                    // buildMLSPredictions(), // Temporarily disabled to debug NFL
                ]);
                // Flatten the results array and update the state
                const flattened = results.flat();
                console.log('🎯 Setting predictions state with:', flattened.length, 'predictions');
                console.log('🎯 Predictions data:', flattened);
                setPredictions(flattened);
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

    // Debug logging
    console.log('🎨 Render - Total predictions:', predictions.length);
    console.log('🎨 Render - Filtered predictions for', activeSport, ':', filteredPredictions.length);
    console.log('🎨 Render - Loading:', loading, 'Error:', error);

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