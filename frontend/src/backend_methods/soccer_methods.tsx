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
// Removed getUpcomingSoccerMatches - replaced with EPL methods above

// EPL Prediction Methods
export const getEPLUpcomingMatches = async (season?: number) => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.epl_upcoming(season));
    } catch (error) {
        console.error("Error fetching EPL upcoming matches:", error);
        throw error;
    }
};

export const predictEPLMatch = async (home: string, away: string, lastN?: number) => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.epl_predict(home, away, lastN));
    } catch (error) {
        console.error(`Error predicting EPL match ${home} vs ${away}:`, error);
        throw error;
    }
};

export const getEPLTeams = async () => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.epl_teams);
    } catch (error) {
        console.error("Error fetching EPL teams:", error);
        throw error;
    }
};

export const canonicalizeEPLTeamName = async (name: string) => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.epl_canonicalize(name));
    } catch (error) {
        console.error(`Error canonicalizing EPL team name ${name}:`, error);
        throw error;
    }
};

export const getEPLModelInfo = async () => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.epl_info);
    } catch (error) {
        console.error("Error fetching EPL model info:", error);
        throw error;
    }
};
