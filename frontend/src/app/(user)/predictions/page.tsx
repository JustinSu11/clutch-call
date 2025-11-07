/*
    File: frontend/src/app/predictions/page.tsx
    Created: 09/29/2025 by Michael Tajchman
    Last Updated: 10/28/2025 by CJ Quintero

    Description: This file contains the main React component for the Predictions screen of the ClutchCall web application.
    It includes a header with navigation, a filterable list of sports, and a table displaying AI-powered match predictions.
*/
"use client";
import React, { useState, useEffect } from 'react';
import { parseUpcomingNFLGames, parseNFLTeamStats, parseNFLTeamLogo } from '@/utils/nfl_parser';
import { parseNBATeamStats } from '@/utils/nba_parser';
import { parseUpcomingMLSGames, parseMLSTeamStats } from '@/utils/mls_parser';
import MatchDialog, { TeamStats } from '@/components/DashboardComponents/Dialog';
import { getNBAGamePredictions, getNBAMLStatus } from '@/backend_methods/nba_methods';
import { GamePrediction, DecisionFactor } from '@/utils/nba_prediction_parser';
import { getNBATeamName } from '@/utils/nba_team_mapping';
import formatDate from '@/utils/date-formatter-for-matches';


// declare data types
type SportKey = 'All Sports' | 'NFL' | 'NBA' | 'MLS';

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
    date: string;           // MM-DD-YYYY
    prediction: string;     // the eventual prediction text
    confidence: number;     // a number between 0 and 100 showing how confident the AI prediction is
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

const buildNFLPredictions = async (): Promise<Prediction[]> => {
    /*
        buildNFLPredictions:
        This method builds a list of Prediction objects for upcoming NFL games.

        returns:
            predictions: an array of Prediction objects for each upcoming NFL game
    */
    const upcomingNFLGames = await parseUpcomingNFLGames();

    // map each game to a Prediction object
    return upcomingNFLGames.map((game) => ({
        match: `${game.awayTeam.displayName} at ${game.homeTeam.displayName}`,
        date: `${game.dateAndTime}`,
        prediction: `${game.homeTeam.displayName} predicted to win`,
        confidence: 100,
        sport: 'NFL'
    }));
};

const buildMLSPredictions = async (): Promise<Prediction[]> => {
    /*
        buildMLSPredictions:
        This method builds a list of Prediction objects for upcoming MLS games.

        returns:
            predictions: an array of Prediction objects for each upcoming MLS game
    */
    const upcomingMLSGames = await parseUpcomingMLSGames();

    // map each game to a Prediction object
    return upcomingMLSGames.map((game) => ({
        match: `${game.awayTeam.displayName} at ${game.homeTeam.displayName}`,
        date: `${game.dateAndTime}`,
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
        const response = await getNBAGamePredictions(3, true);
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

const PredictionRow: React.FC<{ item: Prediction; onClick?: () => void }> = ({ item, onClick }) => {
    const decisionFactors = item.meta?.decisionFactors;
    
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
            <td className="text-center px-6 py-4 whitespace-nowrap">
                <div className="text-md font-medium text-text-primary">{item.match}</div>
            </td>
            <td className="text-center px-6 py-4 whitespace-nowrap">
                <div className="text-md font-medium text-text-primary">{formatDate(item.date)}</div>
            </td>
            <td className="text-center px-6 py-4 whitespace-nowrap">
                <div className="text-md font-medium text-text-primary">{item.prediction}</div>
            </td>
            <td className="text-center px-6 py-4 whitespace-nowrap">
                <div className="flex items-center justify-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-3">
                        <div
                            className="h-2.5 rounded-full"
                            style={{ ...getConfidenceStyle(item.confidence), width: `${item.confidence}%` }}
                        ></div>
                    </div>
                    <span className="text-md font-medium text-text-primary">{item.confidence}%</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex justify-center">
                    <div className="inline-block">
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
                homeLogo = await parseNFLTeamLogo(homeTeam);
                awayLogo = await parseNFLTeamLogo(awayTeam);
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

    // on component mount, fetch predictions for all sports
    useEffect(() => {
        setLoading(true);
        setError(null);

        Promise.all([
            buildNFLPredictions(),
            buildNBAPredictions(),
            buildMLSPredictions(),
        ])
            .then(results => setPredictions(results.flat()))
            .catch(() => setError('Failed to fetch predictions'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadStatus = async () => {
            try {
                const statusResponse = await getNBAMLStatus();
                if (!isMounted) {
                    return;
                }
                const trainingData = statusResponse?.training_status as NBATrainingStatus | undefined;
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
        <div className="overflow-x-auto">
            <header className="">
                {/* header code */}
            </header>
            <main className="">
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
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-secondary">
                            <thead className="bg-secondary-background rounded-xl shadow-sm">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-text-secondary uppercase tracking-wider text-center">Match</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-text-secondary uppercase tracking-wider text-center">Date</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-text-secondary uppercase tracking-wider text-center">Prediction</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-text-secondary uppercase tracking-wider text-center">Confidence</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-text-secondary uppercase tracking-wider text-center">Decision Factors</th>
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
                                            <div className="text-sm text-text-secondary">{item.date}</div>
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
