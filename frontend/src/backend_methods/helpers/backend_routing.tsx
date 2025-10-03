/*
Author: Maaz Haque
File: backend_routing.tsx
Description: This file contains the routes and methods to make requests to the backend.
*/

// Dynamic base URL based on production environment
const getBaseUrl = (): string => {
    const isProduction = process.env.NEXT_PUBLIC_PRODUCTION === 'true';
    const baseUrl = isProduction 
        ? "https://clutch-call.onrender.com/api/v1"
        : "http://127.0.0.1:8000/api/v1";
    
    // Log the environment for debugging (only in development)
    if (!isProduction) {
        console.log(`Backend URL: ${baseUrl} (Production: ${isProduction})`);
    }
    
    return baseUrl;
};

const BASE_URL = getBaseUrl();

export const ROUTES = {
    // Health check
    health: `${BASE_URL}/health`,
    
    // Sports Statistics Analysis Routes
    today_all_games: `${BASE_URL}/today`,
    today_nba_games: `${BASE_URL}/today/nba`,
    today_nfl_games: `${BASE_URL}/today/nfl`,
    today_soccer_games: `${BASE_URL}/today/soccer`,
    
    weekly_all_games: `${BASE_URL}/weekly`,
    weekly_nba_games: `${BASE_URL}/weekly/nba`,
    weekly_nfl_games: `${BASE_URL}/weekly/nfl`,
    weekly_soccer_games: `${BASE_URL}/weekly/soccer`,
    
    live_all_games: `${BASE_URL}/live`,
    live_nba_games: `${BASE_URL}/live/nba`,
    live_nfl_games: `${BASE_URL}/live/nfl`,
    live_soccer_games: `${BASE_URL}/live/soccer`,
    live_status: `${BASE_URL}/live/status`,
    
    historical_all_games: `${BASE_URL}/historical`,
    historical_nba_games: `${BASE_URL}/historical/nba`,
    historical_nfl_games: `${BASE_URL}/historical/nfl`,
    historical_soccer_games: `${BASE_URL}/historical/soccer`,
    statistical_trends: `${BASE_URL}/historical/trends`,
    
    // Individual League Routes (existing)
    nba_games: `${BASE_URL}/nba/games`,
    specific_nba_game_details: (gameId: string) => `${BASE_URL}/nba/game/${gameId}`,
    specific_nba_game_boxscore: (gameId: string) => `${BASE_URL}/nba/game/${gameId}/boxscore`,
    specific_nba_team_last_game: (teamId: string) => `${BASE_URL}/nba/teams/${teamId}/last`,
    upcoming_nba_games: `${BASE_URL}/nba/upcoming`,
    
    nfl_games: `${BASE_URL}/nfl/games`,
    specific_nfl_game_details: (gameId: string) => `${BASE_URL}/nfl/game/${gameId}`,
    specific_nfl_game_boxscore: (gameId: string) => `${BASE_URL}/nfl/game/${gameId}/boxscore`,
    upcoming_nfl_games: `${BASE_URL}/nfl/upcoming`,
    
    soccer_matches: `${BASE_URL}/soccer/matches`,
    specific_soccer_match_details: (matchId: string) => `${BASE_URL}/soccer/game/${matchId}`,
    specific_soccer_match_boxscore: (matchId: string) => `${BASE_URL}/soccer/game/${matchId}/boxscore`,
    upcoming_soccer_matches: `${BASE_URL}/soccer/upcoming`,
};

//method to make a post or get request to the backend using axiom
export const makeBackendRequest = async (method: 'GET' | 'POST', route: string, data?: any) => {
    try {
        const response = await fetch(route, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: method === 'POST' ? JSON.stringify(data) : undefined,
        });
        return response.json();
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
};

export const checkBackendHealth = async () => {
    return makeBackendRequest('GET', ROUTES.health);
}

// Utility function to check current environment
export const getCurrentEnvironment = () => {
    return {
        isProduction: process.env.NEXT_PUBLIC_PRODUCTION === 'true',
        baseUrl: BASE_URL
    };
}

// Utility function to get environment info for debugging
export const getEnvironmentInfo = () => {
    const env = getCurrentEnvironment();
    console.log('Environment Info:', {
        isProduction: env.isProduction,
        baseUrl: env.baseUrl,
        environmentVariable: process.env.NEXT_PUBLIC_PRODUCTION
    });
    return env;
}