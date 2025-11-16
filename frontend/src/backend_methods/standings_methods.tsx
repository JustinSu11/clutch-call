/*
File: standings_methods.tsx
Description: This file contains the methods to make requests to the backend for standings data across different sports.
*/

import { ROUTES, makeBackendRequest, checkBackendHealth } from "./helpers/backend_routing";

export const getNBAStandings = async (season?: string) => {
    try {
        await checkBackendHealth();
        const url = season ? `${ROUTES.nba_standings}?season=${season}` : ROUTES.nba_standings;
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching NBA standings:", error);
        throw error;
    }
};

export const getNFLStandings = async (season?: string) => {
    try {
        await checkBackendHealth();
        const url = season ? `${ROUTES.nfl_standings}?season=${season}` : ROUTES.nfl_standings;
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching NFL standings:", error);
        throw error;
    }
};

export const getSoccerStandings = async (league: string = "EPL", season?: string) => {
    try {
        await checkBackendHealth();
        let url = ROUTES.soccer_standings(league);
        if (season) {
            url += `&season=${season}`;
        }
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error(`Error fetching ${league} standings:`, error);
        throw error;
    }
};
