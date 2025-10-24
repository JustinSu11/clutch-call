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
        : "http://127.0.0.1:8000/api/v1"; // Your local backend base URL
    
    // Log the environment for debugging (only in development)
    if (typeof window !== 'undefined' && !isProduction) { // Check if running in browser
        console.log(`Backend URL: ${baseUrl} (Production: ${isProduction})`);
    }
    
    return baseUrl;
};

const BASE_URL = getBaseUrl();

// --- UPDATE: ROUTES now store relative paths ---
export const ROUTES = {
    // Health check
    health: `/health`,
    
    // Sports Statistics Analysis Routes
    today_all_games: `/today`,
    today_nba_games: `/today/nba`,
    today_nfl_games: `/today/nfl`,
    today_soccer_games: `/today/soccer`,
    
    weekly_all_games: `/weekly`,
    weekly_nba_games: `/weekly/nba`,
    weekly_nfl_games: `/weekly/nfl`,
    weekly_soccer_games: `/weekly/soccer`,
    
    live_all_games: `/live`,
    live_nba_games: `/live/nba`,
    live_nfl_games: `/live/nfl`,
    live_soccer_games: `/live/soccer`,
    live_status: `/live/status`,
    
    historical_all_games: `/historical`,
    historical_nba_games: `/historical/nba`,
    historical_nfl_games: `/historical/nfl`,
    historical_soccer_games: `/historical/soccer`,
    statistical_trends: `/historical/trends`,
    
    // Individual League Routes (relative paths)
    nba_games: `/nba/games`,
    specific_nba_game_details: (gameId: string) => `/nba/game/${gameId}`,
    specific_nba_game_boxscore: (gameId: string) => `/nba/game/${gameId}/boxscore`,
    specific_nba_team_last_game: (teamId: string) => `/nba/teams/${teamId}/last`,
    upcoming_nba_games: `/nba/upcoming`,
    
    nfl_games: `/nfl/games`,
    specific_nfl_game_details: (gameId: string) => `/nfl/game/${gameId}`,
    specific_nfl_game_boxscore: (gameId: string) => `/nfl/game/${gameId}/boxscore`,
    upcoming_nfl_games: `/nfl/upcoming`,
    // Add the relative path definition for NFL prediction
    specific_nfl_prediction: (gameId: string) => `/nfl/predict/${gameId}`, 
    
    soccer_matches: `/soccer/matches`,
    specific_soccer_match_details: (matchId: string) => `/soccer/game/${matchId}`,
    specific_soccer_match_boxscore: (matchId: string) => `/soccer/game/${matchId}/boxscore`,
    upcoming_soccer_matches: `/soccer/upcoming`,
};
// --- END UPDATE ---

// --- UPDATE: makeBackendRequest now prepends BASE_URL ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const makeBackendRequest = async (method: 'GET' | 'POST', relativeRoute: string, data?: any) => {
    // Combine BASE_URL with the relative route
    const fullUrl = `${BASE_URL}${relativeRoute}`; 
    
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') { // Log only in browser during development
       console.log(`Making ${method} request to: ${fullUrl}`); 
    }

    try {
        const response = await fetch(fullUrl, { // <-- Use fullUrl here
            method,
            headers: {
                'Content-Type': 'application/json',
                // Add any other headers needed, like Authorization if you implement login
            },
            body: method === 'POST' ? JSON.stringify(data) : undefined,
        });

        // Check if the response was successful (status code 2xx)
        if (!response.ok) {
            let errorData = { error: `HTTP error! status: ${response.status}` };
            try {
                 // Try to parse error details from the response body
                const body = await response.json();
                errorData = { ...errorData, ...body }; // Combine status error with body details
            } catch (jsonError) {
                // If response is not JSON or empty, use status text
                errorData.error = response.statusText || errorData.error;
            }
            console.error(`API Error (${response.status}):`, errorData);
            // Throw an error object with details
            throw new Error(JSON.stringify(errorData)); 
        }
        
        // Handle cases where the response might be empty (like a 204 No Content)
        if (response.status === 204) {
            return null; 
        }

        return response.json(); // Parse the JSON body

    } catch (error) {
        console.error("Fetch Error:", error);
        // Ensure error is re-thrown so the calling function's catch block works
        throw error; 
    }
};
// --- END UPDATE ---

export const checkBackendHealth = async () => {
    // Pass the relative path from ROUTES
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
    if (typeof window !== 'undefined') { // Log only in browser
       console.log('Environment Info:', {
            isProduction: env.isProduction,
            baseUrl: env.baseUrl,
            environmentVariable: process.env.NEXT_PUBLIC_PRODUCTION
       });
    }
    return env;
}