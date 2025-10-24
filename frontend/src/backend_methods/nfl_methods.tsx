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

/**
 * Gets a prediction for a specific NFL game.
 * @param {string} gameId The ESPN event ID for the game.
 * @returns {Promise<any>} The prediction data from the AI model.
 */
export const getNFLPrediction = async (gameId: string) => {
    try {
        await checkBackendHealth();
        
        // --- Use the ROUTES helper for consistency ---
        return makeBackendRequest('GET', ROUTES.specific_nfl_prediction(gameId)); 
        
    } catch (error) {
        console.error(`Error fetching NFL prediction for gameId ${gameId}:`, error);
        throw error;
    }
};