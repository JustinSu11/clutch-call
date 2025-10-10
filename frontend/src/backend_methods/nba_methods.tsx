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

// ===============================================
// NBA ML PREDICTION METHODS
// ===============================================

export const getNBAMLStatus = async () => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.nba_ml_status);
    } catch (error) {
        console.error("Error fetching NBA ML status:", error);
        throw error;
    }
};

export const getNBAGamePredictions = async (daysAhead: number = 1, includeDetails: boolean = false) => {
    try {
        await checkBackendHealth();
        const params = new URLSearchParams({
            days_ahead: daysAhead.toString(),
            include_details: includeDetails.toString()
        });
        return makeBackendRequest('GET', `${ROUTES.nba_ml_games}?${params}`);
    } catch (error) {
        console.error("Error fetching NBA game predictions:", error);
        throw error;
    }
};

export const getNBAPlayerPredictions = async (
    daysAhead: number = 1,
    gameId?: string,
    teamId?: number,
    minPoints?: number,
    topN?: number
) => {
    try {
        await checkBackendHealth();
        const params = new URLSearchParams({
            days_ahead: daysAhead.toString()
        });
        
        if (gameId) params.append('game_id', gameId);
        if (teamId) params.append('team_id', teamId.toString());
        if (minPoints) params.append('min_points', minPoints.toString());
        if (topN) params.append('top_n', topN.toString());
        
        return makeBackendRequest('GET', `${ROUTES.nba_ml_players}?${params}`);
    } catch (error) {
        console.error("Error fetching NBA player predictions:", error);
        throw error;
    }
};

export const getNBAGamePredictionDetail = async (gameId: string) => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.nba_ml_game_detail(gameId));
    } catch (error) {
        console.error(`Error fetching NBA game prediction detail for gameId ${gameId}:`, error);
        throw error;
    }
};

export const getNBATopPerformers = async (
    daysAhead: number = 1,
    stat: 'points' | 'assists' | 'rebounds' = 'points',
    limit: number = 10,
    minThreshold?: number
) => {
    try {
        await checkBackendHealth();
        const params = new URLSearchParams({
            days_ahead: daysAhead.toString(),
            stat: stat,
            limit: limit.toString()
        });
        
        if (minThreshold) params.append('min_threshold', minThreshold.toString());
        
        return makeBackendRequest('GET', `${ROUTES.nba_ml_top_performers}?${params}`);
    } catch (error) {
        console.error("Error fetching NBA top performers:", error);
        throw error;
    }
};

export const getNBAModelsInfo = async () => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.nba_ml_models_info);
    } catch (error) {
        console.error("Error fetching NBA models info:", error);
        throw error;
    }
};

export const trainNBAModels = async (seasons?: string[], forceRetrain: boolean = false) => {
    try {
        await checkBackendHealth();
        const requestData: any = {
            force_retrain: forceRetrain
        };
        
        if (seasons && seasons.length > 0) {
            requestData.seasons = seasons;
        }
        
        return makeBackendRequest('POST', ROUTES.nba_ml_train, requestData);
    } catch (error) {
        console.error("Error training NBA models:", error);
        throw error;
    }
};

export const deleteNBAModels = async () => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('DELETE', `${ROUTES.nba_ml_delete_models}?confirm=yes`);
    } catch (error) {
        console.error("Error deleting NBA models:", error);
        throw error;
    }
};

// Note: For comprehensive sports betting analysis across all leagues, 
// use the methods in sports_betting_methods.tsx

