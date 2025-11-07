/*
    data_classes.tsx
    Created 10/08/2025 by Christian Quintero
    Last Updated 10/08/2025 by Christian Quintero

    This file contains common data classes used throughout the frontend
*/

export type Team = {
    abbreviation: string
    alternateColor: string
    color: string
    displayName: string
}

export type UpcomingGame = {
    homeTeam: Team;
    awayTeam: Team;
    gameDate: Date; 
    dateAndTime: Date; 
    league: string;                     // YYYY-MM-DD
    gameId?: string;                    // Optional game ID for live tracking
};

export type GameStatus = 'UPCOMING' | 'LIVE' | 'FINAL';

export type PlayerStats = {
    name: string;
    photo?: string;
    stats: Record<string, string | number>;
};

export type TeamLeaders = {
    home: Record<string, PlayerStats>;
    away: Record<string, PlayerStats>;
};

export type LiveGameData = {
    status: GameStatus;
    periodLabel?: string;
    clock?: string;
    score?: {
        home: number;
        away: number;
    };
    leaders?: TeamLeaders;
};