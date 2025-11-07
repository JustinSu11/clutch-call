/*
Author: Maaz Haque
File: sports_stats_methods.tsx
Description: This file contains methods to make requests to the backend for sports statistics data.
             Includes today's games, weekly games, live games, and historical data across all leagues.
*/

import { ROUTES, makeBackendRequest, checkBackendHealth } from "./helpers/backend_routing";

// ==================== TODAY'S GAMES METHODS ====================

export const getTodayAllGames = async (includeStats = true, soccerLeagues?: string[]) => {
    try {
        await checkBackendHealth();
        let url = ROUTES.today_all_games;
        const params = new URLSearchParams();
        
        if (!includeStats) {
            params.append('include_stats', 'false');
        }
        if (soccerLeagues && soccerLeagues.length > 0) {
            soccerLeagues.forEach(league => params.append('soccer_leagues', league));
        }
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching today's games (all leagues):", error);
        throw error;
    }
};

export const getTodayNBAGames = async () => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.today_nba_games);
    } catch (error) {
        console.error("Error fetching today's NBA games:", error);
        throw error;
    }
};

export const getTodayNFLGames = async () => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.today_nfl_games);
    } catch (error) {
        console.error("Error fetching today's NFL games:", error);
        throw error;
    }
};

export const getTodaySoccerGames = async (league = 'MLS') => {
    try {
        await checkBackendHealth();
        const url = `${ROUTES.today_soccer_games}?league=${league}`;
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error(`Error fetching today's Soccer games for ${league}:`, error);
        throw error;
    }
};

// ==================== WEEKLY GAMES METHODS ====================

export const getWeeklyAllGames = async (days = 7, soccerLeagues?: string[]) => {
    try {
        await checkBackendHealth();
        let url = ROUTES.weekly_all_games;
        const params = new URLSearchParams();
        
        if (days !== 7) {
            params.append('days', days.toString());
        }
        if (soccerLeagues && soccerLeagues.length > 0) {
            soccerLeagues.forEach(league => params.append('soccer_leagues', league));
        }
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching weekly games (all leagues):", error);
        throw error;
    }
};

export const getWeeklyNBAGames = async (days = 7) => {
    try {
        await checkBackendHealth();
        const url = days !== 7 ? `${ROUTES.weekly_nba_games}?days=${days}` : ROUTES.weekly_nba_games;
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching weekly NBA games:", error);
        throw error;
    }
};

export const getWeeklyNFLGames = async (days = 7) => {
    try {
        await checkBackendHealth();
        const url = days !== 7 ? `${ROUTES.weekly_nfl_games}?days=${days}` : ROUTES.weekly_nfl_games;
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching weekly NFL games:", error);
        throw error;
    }
};

export const getWeeklySoccerGames = async (days = 7, leagues?: string[]) => {
    try {
        await checkBackendHealth();
        let url = ROUTES.weekly_soccer_games;
        const params = new URLSearchParams();
        
        if (days !== 7) {
            params.append('days', days.toString());
        }
        if (leagues && leagues.length > 0) {
            leagues.forEach(league => params.append('leagues', league));
        }
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching weekly Soccer games:", error);
        throw error;
    }
};

// ==================== LIVE GAMES METHODS ====================

export const getLiveAllGames = async (soccerLeagues?: string[]) => {
    try {
        await checkBackendHealth();
        let url = ROUTES.live_all_games;
        const params = new URLSearchParams();
        
        if (soccerLeagues && soccerLeagues.length > 0) {
            soccerLeagues.forEach(league => params.append('soccer_leagues', league));
        }
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching live games (all leagues):", error);
        throw error;
    }
};

export const getLiveNBAGames = async () => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.live_nba_games);
    } catch (error) {
        console.error("Error fetching live NBA games:", error);
        throw error;
    }
};

export const getLiveNFLGames = async () => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.live_nfl_games);
    } catch (error) {
        console.error("Error fetching live NFL games:", error);
        throw error;
    }
};

export const getLiveSoccerGames = async (leagues?: string[]) => {
    try {
        await checkBackendHealth();
        let url = ROUTES.live_soccer_games;
        const params = new URLSearchParams();
        
        if (leagues && leagues.length > 0) {
            leagues.forEach(league => params.append('leagues', league));
        }
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching live Soccer games:", error);
        throw error;
    }
};

export const getLiveGamesStatus = async () => {
    try {
        await checkBackendHealth();
        return makeBackendRequest('GET', ROUTES.live_status);
    } catch (error) {
        console.error("Error fetching live games status:", error);
        throw error;
    }
};

// ==================== HISTORICAL DATA METHODS ====================

export interface HistoricalGameFilters {
    startDate?: string;    // YYYY-MM-DD format
    endDate?: string;      // YYYY-MM-DD format
    season?: string;       // e.g., "2023", "2023-24"
    teamId?: string;       // Filter by specific team
    league?: string;       // Filter by specific league
    page?: number;         // Pagination page (default 1)
    perPage?: number;      // Items per page (default 50)
    soccerLeagues?: string[]; // For soccer-specific queries
}

export const getHistoricalAllGames = async (filters: HistoricalGameFilters = {}) => {
    try {
        await checkBackendHealth();
        let url = ROUTES.historical_all_games;
        const params = new URLSearchParams();
        
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        if (filters.season) params.append('season', filters.season);
        if (filters.teamId) params.append('team_id', filters.teamId);
        if (filters.league) params.append('league', filters.league);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.perPage) params.append('per_page', filters.perPage.toString());
        if (filters.soccerLeagues && filters.soccerLeagues.length > 0) {
            filters.soccerLeagues.forEach(league => params.append('soccer_leagues', league));
        }
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching historical games (all leagues):", error);
        throw error;
    }
};

export const getHistoricalNBAGames = async (filters: HistoricalGameFilters = {}) => {
    try {
        await checkBackendHealth();
        let url = ROUTES.historical_nba_games;
        const params = new URLSearchParams();
        
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        if (filters.season) params.append('season', filters.season);
        if (filters.teamId) params.append('team_id', filters.teamId);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.perPage) params.append('per_page', filters.perPage.toString());
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching historical NBA games:", error);
        throw error;
    }
};

export const getHistoricalNFLGames = async (filters: HistoricalGameFilters = {}) => {
    try {
        await checkBackendHealth();
        let url = ROUTES.historical_nfl_games;
        const params = new URLSearchParams();
        
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        if (filters.season) params.append('season', filters.season);
        if (filters.teamId) params.append('team_id', filters.teamId);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.perPage) params.append('per_page', filters.perPage.toString());
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching historical NFL games:", error);
        throw error;
    }
};

export const getHistoricalSoccerGames = async (filters: HistoricalGameFilters = {}) => {
    try {
        await checkBackendHealth();
        let url = ROUTES.historical_soccer_games;
        const params = new URLSearchParams();
        
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        if (filters.teamId) params.append('team_id', filters.teamId);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.perPage) params.append('per_page', filters.perPage.toString());
        if (filters.soccerLeagues && filters.soccerLeagues.length > 0) {
            filters.soccerLeagues.forEach(league => params.append('leagues', league));
        }
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching historical Soccer games:", error);
        throw error;
    }
};

// ==================== STATISTICAL TRENDS AND ANALYSIS ====================

export interface StatisticalTrendsFilters {
    league?: string;       // Filter by specific league
    teamId?: string;       // Filter by specific team
    startDate?: string;    // YYYY-MM-DD format
    endDate?: string;      // YYYY-MM-DD format
    statType?: string;     // scoring, defensive, team_performance, all
}

export const getStatisticalTrends = async (filters: StatisticalTrendsFilters = {}) => {
    try {
        await checkBackendHealth();
        let url = ROUTES.statistical_trends;
        const params = new URLSearchParams();
        
        if (filters.league) params.append('league', filters.league);
        if (filters.teamId) params.append('team_id', filters.teamId);
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        if (filters.statType) params.append('stat_type', filters.statType);
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching statistical trends:", error);
        throw error;
    }
};

// ==================== NEW HISTORICAL DATA METHODS ====================

export const getHistoricalNBAAllTeams = async (season?: string, page = 1, perPage = 50) => {
    /**
     * Get historical NBA data for all teams from last season.
     * 
     * @param season - Optional season (e.g., "2023-24")
     * @param page - Page number for pagination
     * @param perPage - Number of items per page
     */
    try {
        await checkBackendHealth();
        let url = ROUTES.historical_nba_all_teams;
        const params = new URLSearchParams();
        
        if (season) params.append('season', season);
        if (page !== 1) params.append('page', page.toString());
        if (perPage !== 50) params.append('per_page', perPage.toString());
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching historical NBA all teams data:", error);
        throw error;
    }
};

export const getHistoricalNFLAllTeams = async (season?: string, page = 1, perPage = 50) => {
    /**
     * Get historical NFL data for all teams from last season.
     * 
     * @param season - Optional season (e.g., "2023")
     * @param page - Page number for pagination
     * @param perPage - Number of items per page
     */
    try {
        await checkBackendHealth();
        let url = ROUTES.historical_nfl_all_teams;
        const params = new URLSearchParams();
        
        if (season) params.append('season', season);
        if (page !== 1) params.append('page', page.toString());
        if (perPage !== 50) params.append('per_page', perPage.toString());
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching historical NFL all teams data:", error);
        throw error;
    }
};

export const getHistoricalSoccerAllTeams = async (leagues?: string[], page = 1, perPage = 50) => {
    /**
     * Get historical Soccer data for all MLS teams from last season.
     * 
     * @param leagues - Optional array of leagues (default: ["MLS"])
     * @param page - Page number for pagination
     * @param perPage - Number of items per page
     */
    try {
        await checkBackendHealth();
        let url = ROUTES.historical_soccer_all_teams;
        const params = new URLSearchParams();
        
        if (leagues && leagues.length > 0) {
            leagues.forEach(league => params.append('leagues', league));
        }
        if (page !== 1) params.append('page', page.toString());
        if (perPage !== 50) params.append('per_page', perPage.toString());
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching historical Soccer all teams data:", error);
        throw error;
    }
};

export const getHistoricalNBATeamByName = async (teamName: string, options?: {
    season?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    perPage?: number;
}) => {
    /**
     * Get historical NBA data for a specific team by name.
     * 
     * @param teamName - Team name (e.g., "los angeles lakers", "Lakers")
     * @param options - Optional filters
     */
    try {
        await checkBackendHealth();
        let url = ROUTES.historical_nba_team_by_name(teamName);
        const params = new URLSearchParams();
        
        if (options?.season) params.append('season', options.season);
        if (options?.startDate) params.append('start_date', options.startDate);
        if (options?.endDate) params.append('end_date', options.endDate);
        if (options?.page && options.page !== 1) params.append('page', options.page.toString());
        if (options?.perPage && options.perPage !== 50) params.append('per_page', options.perPage.toString());
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error(`Error fetching historical NBA team data for ${teamName}:`, error);
        throw error;
    }
};

export const getHistoricalNFLTeamByName = async (teamName: string, options?: {
    season?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    perPage?: number;
}) => {
    /**
     * Get historical NFL data for a specific team by name.
     * 
     * @param teamName - Team name (e.g., "kansas city chiefs", "Chiefs")
     * @param options - Optional filters
     */
    try {
        await checkBackendHealth();
        let url = ROUTES.historical_nfl_team_by_name(teamName);
        const params = new URLSearchParams();
        
        if (options?.season) params.append('season', options.season);
        if (options?.startDate) params.append('start_date', options.startDate);
        if (options?.endDate) params.append('end_date', options.endDate);
        if (options?.page && options.page !== 1) params.append('page', options.page.toString());
        if (options?.perPage && options.perPage !== 50) params.append('per_page', options.perPage.toString());
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error(`Error fetching historical NFL team data for ${teamName}:`, error);
        throw error;
    }
};

export const getHistoricalSoccerTeamByName = async (teamName: string, options?: {
    leagues?: string[];
    startDate?: string;
    endDate?: string;
    page?: number;
    perPage?: number;
}) => {
    /**
     * Get historical Soccer data for a specific team by name.
     * 
     * @param teamName - Team name (e.g., "atlanta united", "LAFC")
     * @param options - Optional filters
     */
    try {
        await checkBackendHealth();
        let url = ROUTES.historical_soccer_team_by_name(teamName);
        const params = new URLSearchParams();
        
        if (options?.leagues && options.leagues.length > 0) {
            options.leagues.forEach(league => params.append('leagues', league));
        }
        if (options?.startDate) params.append('start_date', options.startDate);
        if (options?.endDate) params.append('end_date', options.endDate);
        if (options?.page && options.page !== 1) params.append('page', options.page.toString());
        if (options?.perPage && options.perPage !== 50) params.append('per_page', options.perPage.toString());
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error(`Error fetching historical Soccer team data for ${teamName}:`, error);
        throw error;
    }
};

export const getHistoricalNBASeason = async (season: string, options?: {
    teamName?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    perPage?: number;
}) => {
    /**
     * Get NBA historical data for a specific season with optional team filtering.
     * 
     * @param season - Season year (e.g., "2023-24")
     * @param options - Optional filters
     */
    try {
        await checkBackendHealth();
        let url = ROUTES.historical_nba_season(season);
        const params = new URLSearchParams();
        
        if (options?.teamName) params.append('team_name', options.teamName);
        if (options?.startDate) params.append('start_date', options.startDate);
        if (options?.endDate) params.append('end_date', options.endDate);
        if (options?.page && options.page !== 1) params.append('page', options.page.toString());
        if (options?.perPage && options.perPage !== 100) params.append('per_page', options.perPage.toString());
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error(`Error fetching NBA season ${season} data:`, error);
        throw error;
    }
};

export const getHistoricalNFLSeason = async (season: string, options?: {
    teamName?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    perPage?: number;
}) => {
    /**
     * Get NFL historical data for a specific season with optional team filtering.
     * 
     * @param season - Season year (e.g., "2023")
     * @param options - Optional filters
     */
    try {
        await checkBackendHealth();
        let url = ROUTES.historical_nfl_season(season);
        const params = new URLSearchParams();
        
        if (options?.teamName) params.append('team_name', options.teamName);
        if (options?.startDate) params.append('start_date', options.startDate);
        if (options?.endDate) params.append('end_date', options.endDate);
        if (options?.page && options.page !== 1) params.append('page', options.page.toString());
        if (options?.perPage && options.perPage !== 100) params.append('per_page', options.perPage.toString());
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error(`Error fetching NFL season ${season} data:`, error);
        throw error;
    }
};

export const getHistoricalSoccerSeason = async (season: string, options?: {
    teamName?: string;
    leagues?: string[];
    startDate?: string;
    endDate?: string;
    page?: number;
    perPage?: number;
}) => {
    /**
     * Get Soccer historical data for a specific season with optional team filtering.
     * 
     * @param season - Season year (e.g., "2023")
     * @param options - Optional filters
     */
    try {
        await checkBackendHealth();
        let url = ROUTES.historical_soccer_season(season);
        const params = new URLSearchParams();
        
        if (options?.teamName) params.append('team_name', options.teamName);
        if (options?.leagues && options.leagues.length > 0) {
            options.leagues.forEach(league => params.append('leagues', league));
        }
        if (options?.startDate) params.append('start_date', options.startDate);
        if (options?.endDate) params.append('end_date', options.endDate);
        if (options?.page && options.page !== 1) params.append('page', options.page.toString());
        if (options?.perPage && options.perPage !== 100) params.append('per_page', options.perPage.toString());
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error(`Error fetching Soccer season ${season} data:`, error);
        throw error;
    }
};

export const getNBATeamStats = async (options?: {
    teamName?: string;
    season?: string;
    statType?: string;
}) => {
    /**
     * Get aggregated NBA team performance statistics from historical data.
     * 
     * @param options - Optional filters
     */
    try {
        await checkBackendHealth();
        let url = ROUTES.historical_nba_team_stats;
        const params = new URLSearchParams();
        
        if (options?.teamName) params.append('team_name', options.teamName);
        if (options?.season) params.append('season', options.season);
        if (options?.statType) params.append('stat_type', options.statType);
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching NBA team stats:", error);
        throw error;
    }
};

export const getNFLTeamStats = async (options?: {
    teamName?: string;
    season?: string;
    statType?: string;
}) => {
    /**
     * Get aggregated NFL team performance statistics from historical data.
     * 
     * @param options - Optional filters
     */
    try {
        await checkBackendHealth();
        let url = ROUTES.historical_nfl_team_stats;
        const params = new URLSearchParams();
        
        if (options?.teamName) params.append('team_name', options.teamName);
        if (options?.season) params.append('season', options.season);
        if (options?.statType) params.append('stat_type', options.statType);
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching NFL team stats:", error);
        throw error;
    }
};

export const getSoccerTeamStats = async (options?: {
    teamName?: string;
    leagues?: string[];
    statType?: string;
}) => {
    /**
     * Get aggregated Soccer team performance statistics from historical data.
     * 
     * @param options - Optional filters
     */
    try {
        await checkBackendHealth();
        let url = ROUTES.historical_soccer_team_stats;
        const params = new URLSearchParams();
        
        if (options?.teamName) params.append('team_name', options.teamName);
        if (options?.leagues && options.leagues.length > 0) {
            options.leagues.forEach(league => params.append('leagues', league));
        }
        if (options?.statType) params.append('stat_type', options.statType);
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        return makeBackendRequest('GET', url);
    } catch (error) {
        console.error("Error fetching Soccer team stats:", error);
        throw error;
    }
};

// ==================== UTILITY METHODS ====================

export const refreshLiveData = async () => {
    /**
     * Utility method to refresh live data across all endpoints.
     * Useful for implementing auto-refresh functionality in the UI.
     */
    try {
        const [liveGames, liveStatus] = await Promise.all([
            getLiveAllGames(),
            getLiveGamesStatus()
        ]);
        
        return {
            liveGames,
            liveStatus,
            refreshTimestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error("Error refreshing live data:", error);
        throw error;
    }
};

export const getDashboardData = async () => {
    /**
     * Convenience method to fetch all data needed for a sports statistics dashboard.
     * Includes today's games, weekly outlook, and live games status.
     */
    try {
        const [todayGames, weeklyGames, liveStatus] = await Promise.all([
            getTodayAllGames(),
            getWeeklyAllGames(),
            getLiveGamesStatus()
        ]);
        
        return {
            today: todayGames,
            weekly: weeklyGames,
            liveStatus,
            dashboardTimestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        throw error;
    }
};

export const getHistoricalDashboardData = async () => {
    /**
     * Convenience method to fetch comprehensive historical data for dashboard display.
     * Includes all teams data and statistical trends across leagues.
     */
    try {
        const [nbaAllTeams, nflAllTeams, soccerAllTeams] = await Promise.all([
            getHistoricalNBAAllTeams(),
            getHistoricalNFLAllTeams(),
            getHistoricalSoccerAllTeams()
        ]);
        
        return {
            nba: nbaAllTeams,
            nfl: nflAllTeams,
            soccer: soccerAllTeams,
            dashboardTimestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error("Error fetching historical dashboard data:", error);
        throw error;
    }
};