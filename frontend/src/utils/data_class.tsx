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
    league: string;                     // YYYY-MM-DD
};