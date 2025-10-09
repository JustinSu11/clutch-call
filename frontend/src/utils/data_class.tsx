/*
    data_classes.tsx
    Created 10/08/2025 by Christian Quintero
    Last Updated 10/08/2025 by Christian Quintero

    This file contains common data classes used throughout the frontend
*/

export type UpcomingGame = {
    homeTeam: string;
    awayTeam: string;
    gameDate: string;                       // YYYY-MM-DD
    leaders?: [];                           // array of leaders, optional attr
};

export type Leader = {
    title: string;              // e.g., "Passing Yards"
    playerID: number | string;        // e.g., 2543484
    playerName: string;         // e.g., "P. Mahomes"
    value: number | string;     // e.g., 312 or "312"
    playerHeadshot?: string;   // URL to player's headshot image, optional
}