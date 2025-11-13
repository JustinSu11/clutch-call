/* eslint-disable @typescript-eslint/no-explicit-any */
/*
    File: frontend/src/app/predictions/page.tsx
    Created: 09/29/2025 by Michael Tajchman
    Last Updated: 10/28/2025 by CJ Quintero

    Description: This file contains the main React component for the Predictions screen of the ClutchCall web application.
    It includes a header with navigation, a filterable list of sports, and a table displaying AI-powered match predictions.
*/
"use client";
import React, { useState, useEffect } from 'react';
import { parseUpcomingNFLGames, parseNFLTeamStats, parseTodayNFLGames, parseNFLGamesFromEvents } from '@/utils/nfl_parser';
import { parseNBATeamStats } from '@/utils/nba_parser';
import { parseUpcomingMLSGames, parseMLSTeamStats } from '@/utils/mls_parser';
import MatchDialog, { TeamStats } from '@/components/DashboardComponents/Dialog';
import { getNBAGamePredictions, getNBAMLStatus } from '@/backend_methods/nba_methods';
import { getNBAStandings } from '@/backend_methods/standings_methods';
import { GamePrediction, DecisionFactor } from '@/utils/nba_prediction_parser';
import { getNBATeamName, getNBATeamAbbreviation, getNBATeamPalette } from '@/utils/nba_team_mapping';
import formatDate from '@/utils/date-formatter-for-matches';

// Import the method that calls your backend prediction API
import { getNFLPrediction, getUpcomingNFLGames } from '@/backend_methods/nfl_methods';



// declare data types
type SportKey = 'All Sports' | 'NFL' | 'NBA' | 'MLS';

type Game = {
    id: string; // Ensure the parsed game object includes an ID
    homeTeam: string;
    awayTeam: string;
    date?: string; // Formatted date string
    dateAndTime?: string;
    homeTeamLogo?: string; 
    awayTeamLogo?: string;
    status?: {
        state?: string;
        type?: string;
    };
};

type PredictionMeta = {
    gameId?: string;
    homeTeamId?: number;
    awayTeamId?: number;
    confidenceDecimal?: number;
    decisionFactors?: DecisionFactor[];
    [key: string]: unknown;
};

type Prediction = {
    match: string;          // gets built from homeTeam and awayTeam 
    date?: string;           // MM-DD-YYYY for backward compatibility
    dateAndTime?: string | Date;  // Add dateAndTime property for proper time display
    homeTeamLogo?: string;
    awayTeamLogo?: string;
    prediction: string;     // the eventual prediction text
    confidence: number;     // a number between 0 and 100 showing how confident the AI prediction is
    analysis?: string;        // Add this field for NFL
    sport: SportKey;        // the sport this prediction belongs to used for filtering (NFL, NBA, MLS)
    meta?: PredictionMeta;
};

type NBATrainingStatus = {
    is_training: boolean;
    started_at?: string;
    completed_at?: string;
    last_success?: boolean | null;
    last_message?: string | null;
    last_error?: string | null;
    requested_seasons?: string[];
};

type NBAMLStatusResponse = {
    training_status?: NBATrainingStatus;
};

type NBAGamePredictionsResponse = {
    games?: GamePrediction[];
};

type NBAStandingsResponse = {
    eastern_conference?: Array<{
        team_id: number;
        team_logo?: string | null;
    }>;
    western_conference?: Array<{
        team_id: number;
        team_logo?: string | null;
    }>;
};


const buildNFLPredictions = async (): Promise<Prediction[]> => {
    /*
        buildNFLPredictions:
        This method builds a list of Prediction objects for NFL games
        by calling the AI backend for each game.
        Now supports both upcoming (pre-game) and in-progress games.
    */
   
    console.log('Starting NFL predictions build...');
    
    // Fetch upcoming and today's games
    let upcomingGamesRaw: any = null;
    let todayGames: Game[] = [];
    
    try {
        console.log('Fetching upcoming NFL games...');
        // Get raw response to access event IDs
        upcomingGamesRaw = await getUpcomingNFLGames();
        console.log(`Fetched upcoming games response`);
    } catch (error) {
        console.error('Error fetching upcoming games:', error);
    }
    
    try {
        console.log('Fetching today\'s NFL games...');
        todayGames = await parseTodayNFLGames();
        console.log(`Fetched ${todayGames.length} today's games`);
    } catch (error) {
        console.error('Error fetching today\'s games:', error);
    }
    
    // Combine and filter for future games only
    const now = new Date();
    const allGames: Game[] = [];
    
    // Convert upcoming games to Game format - use parseNFLGamesFromEvents to get IDs
    if (upcomingGamesRaw && upcomingGamesRaw.events) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const upcomingEvents = upcomingGamesRaw.events.filter((event: any) => {
            const eventDate = event.date ? new Date(event.date) : null;
            return eventDate && eventDate > now;
        });
        
        if (upcomingEvents.length > 0) {
            const upcomingGamesWithIds = parseNFLGamesFromEvents(upcomingEvents);
            upcomingGamesWithIds.forEach((game) => {
                const gameDate = game.dateAndTime ? new Date(game.dateAndTime) : 
                                game.date ? new Date(game.date) : null;
                if (gameDate && gameDate > now) {
                    allGames.push(game);
                }
            });
        }
    }
    
    // Add today's games that are in the future
    todayGames.forEach((game) => {
        const gameDate = game.dateAndTime ? new Date(game.dateAndTime) : 
                        game.date ? new Date(game.date) : null;
        if (gameDate && gameDate > now) {
            allGames.push(game);
        }
    });
    
    // Remove duplicates based on game ID
    const uniqueGames = Array.from(
        new Map(allGames.map(game => [game.id, game])).values()
    );
    
    console.log(`Total unique future games: ${uniqueGames.length}`);
    
    // Filter for games we can predict (upcoming or in-progress)
    const predictableGames = uniqueGames.filter((game) => {
        // Only include games with valid IDs
        if (!game.id || game.id === '') {
            console.warn(`Skipping game without ID: ${game.awayTeam} @ ${game.homeTeam}`);
            return false;
        }
        
        const statusState = (game.status?.state || '').toLowerCase();
        const statusType = (game.status?.type || '').toLowerCase();
        const isUpcoming = statusState === 'pre' || statusType === 'scheduled' || statusType === 'pre';
        const isInProgress = ['in', 'live', 'inprogress'].includes(statusState) || 
                            statusType.includes('in-progress') || 
                            statusType.includes('live');
        return isUpcoming || isInProgress;
    });
    
    console.log(`Games available for prediction: ${predictableGames.length}`);
    
    if (predictableGames.length === 0) {
        console.log('No games available for prediction');
        return [];
    }
    
    // Map over the predictableGames array
    console.log(`Starting prediction requests for ${predictableGames.length} games...`);
    const predictionPromises = predictableGames.map(async (game) => {
    try {
        console.log(` Requesting prediction for game ${game.id} (${game.awayTeam} @ ${game.homeTeam})...`);
        // We know game.id is a string here
        const aiPrediction = await getNFLPrediction(game.id);
        console.log(` Received response for game ${game.id}:`, aiPrediction);

        if (aiPrediction.error) {
            // Handle 422 errors gracefully (expected for games that just started or have insufficient data)
            const errorMsg = aiPrediction.error?.toString() || '';
            if (errorMsg.includes('Cannot predict upcoming games') || 
                errorMsg.includes('Insufficient game data') ||
                errorMsg.includes('422')) {
                console.log(` Game ${game.id} cannot be predicted yet (expected):`, aiPrediction.error);
                return null;
            }
            console.error(` Failed to get prediction for game ${game.id}:`, aiPrediction.error, aiPrediction.details);
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map(([feature, data]: [string, any]) => ({
                    feature,
                    ...data,
                    absContribution: Math.abs(data.contribution)
                }))
                .sort((a, b) => b.absContribution - a.absContribution);
            
            // Build analysis from top decision factors - cleaner format
            const topFactors = sortedFactors.slice(0, 2); // Top 2 most influential
            
            const factors = topFactors.map((factor) => {
                const featureName = factor.feature === 'WinPercentage' ? 'Win percentage' :
                                  factor.feature === 'PointDifferential' ? 'Point differential' :
                                  factor.feature === 'OffensiveStrength' ? 'Offensive strength' :
                                  factor.feature === 'HomeFieldAdvantage' ? 'Home field advantage' :
                                  factor.feature === 'HomeYards' ? 'Home yards' :
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
            date: game.date || '', // Keep for backward compatibility
            dateAndTime: game.dateAndTime || game.date || '', // Use dateAndTime if available for proper time display
            homeTeamLogo: game.homeTeamLogo || '', // Pass logo URL
            awayTeamLogo: game.awayTeamLogo || '', // Pass logo URL
            prediction: winnerName + ' to win',
            confidence: isNaN(confidenceValue) ? 0 : confidenceValue,
            analysis: analysisText,
            sport: 'NFL' as SportKey,
        };
        
        console.log(` Successfully built prediction for game ${game.id}:`, prediction);
        return prediction;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        // Handle network errors or 422 errors in the catch block
        const errorMessage = error?.message || '';
        console.error(` Exception for game ${game.id}:`, error);
        if (errorMessage.includes('422') || 
            errorMessage.includes('Cannot predict upcoming games') ||
            errorMessage.includes('Insufficient game data')) {
            console.log(` Game ${game.id} cannot be predicted yet (caught error):`, errorMessage);
            return null;
        }
        console.error(` Error fetching prediction for game ${game.id}:`, error);
        return null;
    }
});

// Wait for all the API calls to complete
console.log(' Waiting for all prediction requests to complete...');
const predictions = await Promise.all(predictionPromises);

// Filter out any games that failed to get a prediction
const filteredPredictions = predictions.filter(p => p !== null) as Prediction[];
console.log(` Final results: ${filteredPredictions.length} successful predictions out of ${predictableGames.length} eligible games`);
console.log(' Predictions:', filteredPredictions);

if (filteredPredictions.length === 0 && predictableGames.length > 0) {
    console.warn(' WARNING: Had eligible games but no successful predictions. Check backend logs for errors.');
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
        match: `${game.awayTeam.displayName} at ${game.homeTeam.displayName}`,
        date: game.dateAndTime ? String(game.dateAndTime) : '', // Keep for backward compatibility
        dateAndTime: game.dateAndTime || '', // Use dateAndTime for proper time display
        prediction: `${game.homeTeam.displayName} predicted to win`,
        confidence: 100,
        sport: 'MLS'
    }));
}

const formatGameDate = (input?: string | null): string => {
    if (!input) {
        return '';
    }

    const trimmed = input.trim();

    if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts.length === 3) {
            const [month, day, year] = parts;
            return `${month.padStart(2, '0')}-${day.padStart(2, '0')}-${year}`;
        }
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        const year = parsed.getFullYear();
        return `${month}-${day}-${year}`;
    }

    return trimmed;
};

const normalizeConfidence = (value?: number | null): number => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return 0;
    }
    const percent = Math.round(value * 100);
    return Math.min(100, Math.max(0, percent));
};

const formatTimestamp = (iso?: string | null): string | null => {
    if (!iso) {
        return null;
    }
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed.toLocaleString();
};

const buildNBAPredictions = async (): Promise<Prediction[]> => {
    try {
    const response = await getNBAGamePredictions(3, true) as NBAGamePredictionsResponse | null | undefined;
    const games: GamePrediction[] = Array.isArray(response?.games) ? response.games : [];

        return games.map((game) => {
            const homeName = getNBATeamName(game.home_team_id);
            const awayName = getNBATeamName(game.away_team_id);
            const predictedWinnerName = game.predicted_winner === 'home' ? homeName : awayName;

            const confidenceRaw = typeof game.confidence === 'number'
                ? game.confidence
                : Math.max(game.home_win_probability ?? 0, game.away_win_probability ?? 0);

            return {
                match: `${awayName} at ${homeName}`,
                date: formatGameDate(game.game_date),
                prediction: `${predictedWinnerName} predicted to win`,
                confidence: normalizeConfidence(confidenceRaw),
                sport: 'NBA',
                meta: {
                    gameId: game.game_id,
                    homeTeamId: game.home_team_id,
                    awayTeamId: game.away_team_id,
                    confidenceDecimal: confidenceRaw,
                    decisionFactors: game.decision_factors,
                }
            };
        });
    } catch (error) {
        console.error('Failed to build NBA predictions:', error);
        return [];
    }
};

const getConfidenceStyle = (confidence: number) => {
    /* getConfidenceStyle:
        This function returns a style object for the confidence bar based on the confidence percentage.
    */
    const clampedConfidence = Math.max(0, Math.min(100, confidence));
    const hue = (clampedConfidence / 100) * 100; // Hue goes from 0 (red) to 100 (greenish)
    return { backgroundColor: `hsl(${hue}, 90%, 45%)` };
};

const getNFLTeamStats = async (teamName: string) => {
    /*
        getTeamStats:
        This method gets the current season stats for a given NFL team.
        
        params:
            teamName: string - the full display name of the team (e.g., "Dallas Cowboys")
        returns:
            stats: dict - an object containing wins, losses, ties, and totalGames

    */
   
    const stats = await parseNFLTeamStats(`${teamName}`);

    return stats;
}

const getMLSTeamStats = async (teamName: string) => {
    /*
        getTeamStats:
        This method gets the current season stats for a given MLS team.
        
        params:
            teamName: string - the full display name of the team (e.g., "LA Galaxy")
        returns:
            stats: dict - an object containing wins, losses, ties, and totalGames
    */
   
    const stats = await parseMLSTeamStats(`${teamName}`);

    return stats;
}

const getNBATeamStats = async (teamName: string) => {
    /*
        getTeamStats:
        This method gets the current season stats for a given NBA team.
        
        params:
            teamName: string - the full display name of the team (e.g., "Los Angeles Lakers")
        returns:
            stats: dict - an object containing wins, losses, ties, and totalGames

    */
   
    const stats = await parseNBATeamStats(`${teamName}`);

    return stats;
}


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
                } cursor-pointer mr-2`}
            >
                {sport}
            </button>
        ))}
    </div>
);

const formatFactorName = (factor: string): string => {
    // Convert snake_case or technical names to human-readable format
    const nameMap: Record<string, string> = {
        'home_win_pct': 'Home Win %',
        'away_win_pct': 'Away Win %',
        'home_offensive_rating': 'Home Offense',
        'away_offensive_rating': 'Away Offense',
        'home_defensive_rating': 'Home Defense',
        'away_defensive_rating': 'Away Defense',
        'home_net_rating': 'Home Net Rating',
        'away_net_rating': 'Away Net Rating',
        'home_pace': 'Home Pace',
        'away_pace': 'Away Pace',
        'home_elo': 'Home ELO',
        'away_elo': 'Away ELO',
        'rest_days_home': 'Home Rest Days',
        'rest_days_away': 'Away Rest Days',
        'home_last_5': 'Home Recent Form',
        'away_last_5': 'Away Recent Form',
        'home_streak': 'Home Streak',
        'away_streak': 'Away Streak',
    };
    
    if (nameMap[factor]) {
        return nameMap[factor];
    }
    
    // Fallback: convert snake_case to Title Case
    return factor
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const formatFactorValue = (factor: DecisionFactor): string => {
    // Format the actual value of the factor for display
    const value = factor.value;
    const factorName = factor.factor;
    
    // For percentage-based stats
    if (factorName.includes('pct') || factorName.includes('PCT') || factorName.includes('win')) {
        return `${(value * 100).toFixed(1)}%`;
    }
    
    // For ratings and pace (typically 90-120 range)
    if (factorName.includes('rating') || factorName.includes('pace')) {
        return value.toFixed(1);
    }
    
    // For streak (show with + or -)
    if (factorName.includes('streak') || factorName.includes('STREAK')) {
        const streakValue = Math.round(value);
        return streakValue >= 0 ? `+${streakValue}` : `${streakValue}`;
    }
    
    // For rest days
    if (factorName.includes('rest') || factorName.includes('REST')) {
        return `${Math.round(value)} days`;
    }
    
    // For points per game
    if (factorName.includes('ppg') || factorName.includes('PPG') || factorName.includes('PTS')) {
        return `${value.toFixed(1)} pts`;
    }
    
    // Default: show as decimal with 1 decimal place
    return value.toFixed(1);
};

const buildFallbackAbbreviation = (name: string): string => {
    if (!name) {
        return 'NBA';
    }
    const initials = name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0] ?? '')
        .join('');
    const fallback = initials || name.substring(0, 3);
    return fallback.toUpperCase().slice(0, 3);
};

const NBATeamDisplay: React.FC<{ teamId?: number; name: string; logoUrl?: string }> = ({ teamId, name, logoUrl }) => {
    const { primary, secondary } = typeof teamId === 'number'
        ? getNBATeamPalette(teamId)
        : { primary: '#1F2937', secondary: '#F9FAFB' };
    const abbreviation = typeof teamId === 'number'
        ? (getNBATeamAbbreviation(teamId) ?? buildFallbackAbbreviation(name))
        : buildFallbackAbbreviation(name);

    return (
        <div className="flex min-w-[150px] items-center gap-3">
            {logoUrl ? (
                <img
                    src={logoUrl}
                    alt={`${name} logo`}
                    className="h-10 w-10 object-contain"
                />
            ) : (
                <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold uppercase"
                    style={{ backgroundColor: primary, color: secondary }}
                >
                    {abbreviation}
                </div>
            )}
            <span className="text-sm font-semibold text-text-primary text-left leading-snug">
                {name}
            </span>
        </div>
    );
};

const PredictionRow: React.FC<{ item: Prediction; onClick?: () => void; nbaTeamLogos?: Record<number, string> }> = ({ item, onClick, nbaTeamLogos }) => {
    const decisionFactors = item.meta?.decisionFactors;
    const [awayMatchName = '', homeMatchName = ''] = item.match.split(' at ').map((part) => part?.trim() ?? '');
    const isNBA = item.sport === 'NBA';
    const homeTeamId = typeof item.meta?.homeTeamId === 'number' ? item.meta?.homeTeamId : undefined;
    const awayTeamId = typeof item.meta?.awayTeamId === 'number' ? item.meta?.awayTeamId : undefined;
    const homeTeamName = isNBA && homeTeamId ? getNBATeamName(homeTeamId) : homeMatchName;
    const awayTeamName = isNBA && awayTeamId ? getNBATeamName(awayTeamId) : awayMatchName;
    const homeLogoUrl = isNBA && homeTeamId ? nbaTeamLogos?.[homeTeamId] : item.homeTeamLogo;
    const awayLogoUrl = isNBA && awayTeamId ? nbaTeamLogos?.[awayTeamId] : item.awayTeamLogo;
    
    const renderDecisionFactors = () => {
        if (item.sport !== 'NBA' || !Array.isArray(decisionFactors) || decisionFactors.length === 0) {
            return <span className="text-text-secondary italic">N/A</span>;
        }
        
        // Sort by contribution and take top 3
        const topFactors = [...decisionFactors]
            .sort((a, b) => (b.contribution || 0) - (a.contribution || 0))
            .slice(0, 3);
        
        return (
            <div className="space-y-1.5 text-left">
                {topFactors.map((factor, idx) => (
                    <div key={idx} className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-text-primary">
                                {formatFactorName(factor.factor)}
                            </span>
                            <span className="text-xs font-semibold text-primary">
                                {(factor.contribution * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div className="text-xs text-text-secondary pl-1">
                            Value: {formatFactorValue(factor)}
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    
    return (
        <tr onClick={onClick} className="bg-secondary-background hover:bg-secondary cursor-pointer">
            <td className="px-4 py-4 align-middle">
                {isNBA ? (
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                        <NBATeamDisplay teamId={awayTeamId} name={awayTeamName} logoUrl={awayLogoUrl} />
                        <span className="text-xs font-semibold uppercase text-text-secondary">@</span>
                        <NBATeamDisplay teamId={homeTeamId} name={homeTeamName} logoUrl={homeLogoUrl} />
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-3">
                        {/* Away team logo */}
                        {item.awayTeamLogo && (
                            <img 
                                src={item.awayTeamLogo} 
                                alt={awayTeamName} 
                                className="w-8 h-8 object-contain"
                            />
                        )}
                        <div className="text-sm font-semibold text-text-primary text-center whitespace-normal">{item.match}</div>
                        {/* Home team logo */}
                        {item.homeTeamLogo && (
                            <img 
                                src={item.homeTeamLogo} 
                                alt={homeTeamName} 
                                className="w-8 h-8 object-contain"
                            />
                        )}
                    </div>
                )}
            </td>
            <td className="px-4 py-4 text-center align-middle">
                <div className="text-sm font-medium text-text-primary">
                    {item.dateAndTime ? formatDate(item.dateAndTime) : (item.date ? formatDate(item.date) : 'N/A')}
                </div>
            </td>
            <td className="px-4 py-4 text-center align-middle">
                <div className="text-sm font-medium text-text-primary leading-snug">{item.prediction}</div>
            </td>
            <td className="px-4 py-4 text-center align-middle">
                <div className="flex items-center justify-center gap-3">
                    <div className="h-2 w-20 rounded-full bg-gray-200">
                        <div
                            className="h-2 rounded-full"
                            style={{ ...getConfidenceStyle(item.confidence), width: `${item.confidence}%` }}
                        ></div>
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{item.confidence}%</span>
                </div>
            </td>
            <td className="px-4 py-4 align-top">
                <div className="flex justify-center">
                    <div className="inline-block max-w-[260px] text-left">
                        {renderDecisionFactors()}
                    </div>
                </div>
            </td>
        </tr>
    );
};

// --- Main App Component ---
export default function PredictionsScreen() {
    const sports: SportKey[] = ['All Sports', 'NFL', 'NBA', 'MLS'];
    const [activeSport, setActiveSport] = useState<SportKey>('NFL');
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogLoading, setDialogLoading] = useState(false);
    const [selectedHome, setSelectedHome] = useState<string | undefined>(undefined);
    const [selectedAway, setSelectedAway] = useState<string | undefined>(undefined);
    const [homeStats, setHomeStats] = useState<TeamStats | null>(null);
    const [awayStats, setAwayStats] = useState<TeamStats | null>(null);
    const [nbaTrainingStatus, setNbaTrainingStatus] = useState<NBATrainingStatus | null>(null);
    const [nbaTeamLogos, setNbaTeamLogos] = useState<Record<number, string>>({});
    const [homeLogo, setHomeLogo] = useState<string>('');
    const [awayLogo, setAwayLogo] = useState<string>('');

    const openMatchDialog = async (homeTeam: string, awayTeam: string, sport: SportKey) => {
        setSelectedHome(homeTeam);
        setSelectedAway(awayTeam);
        setDialogOpen(true);
        setDialogLoading(true);
        setHomeStats(null);
        setAwayStats(null);
        setHomeLogo('');
        setAwayLogo('');

        // fetch team stats based on sport
        try {
            let home = { wins: 0, losses: 0, ties: 0, totalGames: 0 };
            let away = { wins: 0, losses: 0, ties: 0, totalGames: 0 };
            let homeLogo = '';
            let awayLogo = '';
            if (sport === 'NFL') {
                home = await getNFLTeamStats(homeTeam);
                away = await getNFLTeamStats(awayTeam);
            }
            else if (sport === 'MLS') {
                home = await getMLSTeamStats(homeTeam);
                away = await getMLSTeamStats(awayTeam);
            }
            else if (sport === 'NBA') {
                home = await getNBATeamStats(homeTeam);
                away = await getNBATeamStats(awayTeam);
            }
            setHomeStats({
                wins: home.wins,
                losses: home.losses,
                ties: home.ties,
                totalGames: home.totalGames,
            });
            setAwayStats({
                wins: away.wins,
                losses: away.losses,
                ties: away.ties,
                totalGames: away.totalGames,
            });

            // set logos if available
            setHomeLogo(homeLogo ?? '');
            setAwayLogo(awayLogo ?? '');
        } catch {
            setHomeStats(null);
            setAwayStats(null);
            setHomeLogo('');
            setAwayLogo('');
        } finally {
            setDialogLoading(false);
        }
    };

    // --- UPDATED useEffect Hook ---
    useEffect(() => {
        setLoading(true);
        setError(null);

        // Fetch predictions for all sports concurrently on mount
        Promise.all([
            buildNFLPredictions(),
            buildNBAPredictions(),
            buildMLSPredictions(),
        ])
            .then(results => {
                const flattened = results.flat();
                console.log(' Setting predictions state with:', flattened.length, 'predictions');
                console.log(' Predictions data:', flattened);
                setPredictions(flattened);
            })
            .catch((err) => {
                console.error("Error fetching predictions:", err);
                setError('Failed to fetch predictions');
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadLogos = async () => {
            try {
                const standings = await getNBAStandings();
                if (!isMounted || !standings) {
                    return;
                }

                const parsed = standings as NBAStandingsResponse;
                const allTeams = [
                    ...(parsed.eastern_conference ?? []),
                    ...(parsed.western_conference ?? []),
                ];

                if (allTeams.length === 0) {
                    return;
                }

                const logoMap: Record<number, string> = {};
                for (const team of allTeams) {
                    if (typeof team.team_id === 'number' && team.team_logo) {
                        logoMap[team.team_id] = team.team_logo;
                    }
                }

                if (isMounted && Object.keys(logoMap).length > 0) {
                    setNbaTeamLogos(prev => ({ ...prev, ...logoMap }));
                }
            } catch (err) {
                console.warn('Failed to load NBA team logos for predictions view', err);
            }
        };

        loadLogos();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadStatus = async () => {
            try {
                const statusResponse = await getNBAMLStatus();
                if (!isMounted) {
                    return;
                }
                const trainingData = (statusResponse as NBAMLStatusResponse | null | undefined)?.training_status;
                setNbaTrainingStatus(trainingData ?? null);
            } catch {
                if (isMounted) {
                    setNbaTrainingStatus(null);
                }
            }
        };

        loadStatus();
        const intervalId = window.setInterval(loadStatus, 10000);

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
        };
    }, []);

    const filteredPredictions = activeSport === 'All Sports'
        ? predictions
        : predictions.filter(p => p.sport === activeSport);

    const isNBATraining = nbaTrainingStatus?.is_training === true;
    const trainingStarted = formatTimestamp(nbaTrainingStatus?.started_at);
    const trainingMessage = nbaTrainingStatus?.last_message ?? 'NBA models are currently retraining.';

    return (
    <div className="px-3 sm:px-6 lg:px-8">
            <header className="">
                {/* header code */}
            </header>
            <main className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-text-primary mb-4">Predictions</h2>
                    <p className="text-text-primary mb-4">AI-powered predictions for upcoming sports matches.</p>
                </div>
                {isNBATraining && (
                    <div className="mb-6 rounded-md border border-yellow-400 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
                        {trainingMessage}
                        {trainingStarted && (
                            <span className="mt-1 block text-xs text-yellow-800">
                                Started: {trainingStarted}
                            </span>
                        )}
                    </div>
                )}
                <SportsFilter sports={sports} activeSport={activeSport} setActiveSport={setActiveSport} />
                <div className="rounded-lg overflow-hidden">
                    {/* Desktop table */}
                    <div className="hidden sm:block">
                        <table className="w-full table-auto divide-y divide-secondary">
                            <thead className="bg-secondary-background rounded-xl shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">Match</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">Date</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">Prediction</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">Confidence</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">Decision Factors</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-text-primary bg-secondary-background">
                                            Loading predictions...
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-text-primary bg-secondary-background">
                                            {error}
                                        </td>
                                    </tr>
                                ) : filteredPredictions.length > 0 ? (
                                    filteredPredictions.map((item, idx) => {
                                        const [awayTeam, homeTeam] = item.match.split(' at ');
                                        return (
                                            <PredictionRow
                                                key={idx}
                                                item={item}
                                                onClick={() => openMatchDialog(homeTeam ?? '', awayTeam ?? '', item.sport)}
                                                nbaTeamLogos={nbaTeamLogos}
                                            />
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-text-primary bg-secondary-background">
                                            No predictions available for {activeSport}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden space-y-4">
                        {loading ? (
                            <div className="text-center py-10 text-text-primary bg-secondary-background rounded-lg">
                                Loading predictions...
                            </div>
                        ) : error ? (
                            <div className="text-center py-10 text-text-primary bg-secondary-background rounded-lg">
                                {error}
                            </div>
                        ) : filteredPredictions.length > 0 ? (
                            filteredPredictions.map((item, idx) => {
                                const [awayTeam, homeTeam] = item.match.split(' at ');
                                return (
                                    <div
                                        key={idx}
                                        className="bg-secondary-background p-4 rounded-lg cursor-pointer hover:bg-secondary"
                                        onClick={() => openMatchDialog(homeTeam ?? '', awayTeam ?? '', item.sport)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium text-text-primary">{item.match}</div>
                                            <div className="text-sm text-text-secondary">
                                                {item.dateAndTime ? formatDate(item.dateAndTime) : (item.date ? formatDate(item.date) : 'N/A')}
                                            </div>
                                        </div>
                                        <div className="text-sm text-text-primary mb-3">{item.prediction}</div>
                                        <div className="flex items-center">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                                                <div
                                                    className="h-2 rounded-full"
                                                    style={{ ...getConfidenceStyle(item.confidence), width: `${item.confidence}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-text-primary">{item.confidence}%</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-10 text-text-primary bg-secondary-background rounded-lg">
                                No predictions available for {activeSport}.
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <MatchDialog
                open ={dialogOpen}
                onClose={() => setDialogOpen(false)}
                homeTeam={selectedHome}
                awayTeam={selectedAway}
                homeStats={homeStats}
                awayStats={awayStats}
                loading={dialogLoading}
                homeLogo={homeLogo}
                awayLogo={awayLogo}
            />
        </div>
    );
}
