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
import { parseUpcomingNBAGames, parseNBATeamStats } from '@/utils/nba_parser';
import { parseUpcomingMLSGames, parseMLSTeamStats } from '@/utils/mls_parser';
import { UpcomingGame } from '@/utils/data_class';
import { get } from 'http';
import { urlToHttpOptions } from 'url';
import MatchDialog, { TeamStats } from '@/components/DashboardComponents/Dialog';
import formatDate from '@/utils/date-formatter-for-matches';


// declare data types
type SportKey = 'All Sports' | 'NFL' | 'NBA' | 'MLS';

type Prediction = {
    match: string;          // gets built from homeTeam and awayTeam 
    date: string;           // MM-DD-YYYY
    prediction: string;     // the eventual prediction text
    confidence: number;     // a number between 0 and 100 showing how confident the AI prediction is
    sport: SportKey;        // the sport this prediction belongs to used for filtering (NFL, NBA, MLS)
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

const buildNBAPredictions = async (): Promise<Prediction[]> => {
    /*
        buildNBAPredictions:
        This method builds a list of Prediction objects for upcoming NBA games.

        returns:
            predictions: an array of Prediction objects for each upcoming NBA game
    */
    const upcomingNBAGames = await parseUpcomingNBAGames();

    // map each game to a Prediction object
    return upcomingNBAGames.map((game) => ({
        match: `${game.awayTeam} at ${game.homeTeam}`,
        date: `${game.gameDate}`,
        prediction: `${game.homeTeam} predicted to win`,
        confidence: 100,
        sport: 'NBA'
    }));
}

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

const PredictionRow: React.FC<{ item: Prediction; onClick?: () => void }> = ({ item, onClick }) => (
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
    </tr>
);

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
            // buildNBAPredictions(),
            buildMLSPredictions(),
        ])
            .then(results => setPredictions(results.flat()))
            .catch(() => setError('Failed to fetch predictions'))
            .finally(() => setLoading(false));
    }, []);

    const filteredPredictions = activeSport === 'All Sports'
        ? predictions
        : predictions.filter(p => p.sport === activeSport);

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
                                        <td colSpan={4} className="text-center py-10 text-text-primary bg-secondary-background">
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
