/*
Author: Maaz Haque
File: soccer_methods.tsx
Description: This file contains the methods to make requests to the backend for Soccer data.
 */

import { checkBackendHealth, makeBackendRequest, ROUTES } from "./helpers/backend_routing";

export const getSoccerMatches = async () => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.soccer_matches);
    }
    catch (error) {
        console.error("Error fetching soccer matches:", error);
        throw error;
    }
};
export const getSpecificSoccerMatchDetails = async (matchId: string) => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.specific_soccer_match_details(matchId));
    }
    catch (error) {
        console.error(`Error fetching soccer match details for matchId ${matchId}:`, error);
        throw error;
    }
};
export const getSpecificSoccerMatchBoxscore = async (matchId: string) => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.specific_soccer_match_boxscore(matchId));
    }
    catch (error) {
        console.error(`Error fetching soccer match boxscore for matchId ${matchId}:`, error);
        throw error;
    }
};
export const getUpcomingSoccerMatches = async () => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.upcoming_soccer_matches);
    }
    catch (error) {
        console.error("Error fetching upcoming soccer matches:", error);
        throw error;
    }
};  
