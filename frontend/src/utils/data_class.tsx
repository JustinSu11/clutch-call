/*
    data_classes.tsx
    Created 10/08/2025 by Christian Quintero
    Last Updated 10/08/2025 by Christian Quintero

    This file contains common data classes used throughout the frontend
*/

export type UpcomingGame = {
    homeTeam: string;
    awayTeam: string;
    gameDate: string;       // YYYY-MM-DD
};

// for previous games, we extract more information
export type HistoricalGame = {
    homeTeam: string;
    awayTeam: string;       
    homeScore: number;
    awayScore: number;
    winner: string;         // "home" or "away" or "tie"
    gameDate: string;       // YYYY-MM-DD
};
