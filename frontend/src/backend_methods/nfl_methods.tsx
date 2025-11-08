/* Author: Maaz Haque
   File: nfl_methods.tsx
   Description: This file contains the methods to make requests to the backend for NFL data.
*/

import { checkBackendHealth, makeBackendRequest, ROUTES} from "./helpers/backend_routing";

export const getNFLGames = async () => {
    try{
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.nfl_games);
    } catch (error) {
        console.error("Error fetching NFL games:", error);
        throw error;
    }
};

export const getSpecificNFLGameDetails = async (gameId: string) => {
    try{
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.specific_nfl_game_details(gameId));
    } catch (error) {
        console.error(`Error fetching NFL game details for gameId ${gameId}:`, error);
        throw error;
    }
};

export const getSpecificNFLGameBoxscore = async (gameId: string) => {
    try{
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.specific_nfl_game_boxscore(gameId));
    } catch (error) {
        console.error(`Error fetching NFL game boxscore for gameId ${gameId}:`, error);
        throw error;
    }
};

export const getUpcomingNFLGames = async () => {
    try{
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.upcoming_nfl_games);
    }
    catch (error) {
        console.error("Error fetching upcoming NFL games:", error);
        throw error;
    }
};

export const getTodayNFLGames = async () => {
    try{
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.today_nfl_games);
    }
    catch (error) {
        console.error("Error fetching today's NFL games:", error);
        throw error;
    }
};

/**
 * Gets historical NFL games within a date range.
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<any>} Historical games data
 */
export const getHistoricalNFLGames = async (startDate?: string, endDate?: string) => {
    try {
        await checkBackendHealth();
        
        // Build query string if dates are provided
        let route = ROUTES.historical_nfl_games;
        if (startDate && endDate) {
            route += `?start_date=${startDate}&end_date=${endDate}`;
        }
        
        return makeBackendRequest('GET', route);
    } catch (error) {
        console.error("Error fetching historical NFL games:", error);
        throw error;
    }
};

/**
 * Gets a prediction for a specific NFL game.
 * @param {string} gameId The ESPN event ID for the game.
 * @returns {Promise<any>} The prediction data from the AI model.
 */
export const getNFLPrediction = async (gameId: string) => {
    try {
        await checkBackendHealth();
        
        // --- Use the ROUTES helper for consistency ---
        const result = await makeBackendRequest('GET', ROUTES.specific_nfl_prediction(gameId));
        return result;
        
    } catch (error: any) {
        // If the error was thrown as a JSON string, try to parse it
        let errorData: any = { error: 'Unknown error' };
        try {
            if (error?.message && error.message.startsWith('{')) {
                errorData = JSON.parse(error.message);
            } else {
                errorData = { error: error?.message || 'Network error', details: error };
            }
        } catch (parseError) {
            errorData = { error: error?.message || 'Unknown error', details: error };
        }
        
        console.error(`Error fetching NFL prediction for gameId ${gameId}:`, errorData);
        // Return error object instead of throwing, so caller can check aiPrediction.error
        return errorData;
    }
};