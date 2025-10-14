/*
Author: Maaz Haque
File: nba_methods.tsx
Description: This file contains the methods to make requests to the backend for NBA data.
*/

import { ROUTES, makeBackendRequest, checkBackendHealth } from "../backend_methods/helpers/backend_routing";

export const getNBAGames = async () => {
    try{
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.nba_games);
    } catch (error) {
        console.error("Error fetching NBA games:", error);
        throw error;
    }
};

export const getSpecificNBAGameDetails = async (gameId: string) => {
    try{
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.specific_nba_game_details(gameId));
    } catch (error) {
        console.error(`Error fetching NBA game details for gameId ${gameId}:`, error);
        throw error;
    }
};
export const getSpecificNBAGameBoxscore = async (gameId: string) => {
    try{
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.specific_nba_game_boxscore(gameId));
    } catch (error) {
        console.error(`Error fetching NBA game boxscore for gameId ${gameId}:`, error);
        throw error;
    }
};
export const getSpecificNBATeamLastGame = async (teamId: string) => {
    try{
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.specific_nba_team_last_game(teamId));
    }
    catch (error) {
        console.error(`Error fetching last NBA game for teamId ${teamId}:`, error);
        throw error;
    }
};
export const getUpcomingNBAGames = async () => {
    try{
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.upcoming_nba_games);
    } catch (error) {
        console.error("Error fetching upcoming NBA games:", error);
        throw error;
    }
};

export const getTodayNBAGames = async () => {
    try{
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.today_nba_games);
    } catch (error) {
        console.error("Error fetching today's NBA games:", error);
        throw error;
    }
};

// Note: For comprehensive sports betting analysis across all leagues, 
// use the methods in sports_betting_methods.tsx

