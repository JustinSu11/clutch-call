'use client';

/*
    File: src/app/testing/page.tsx
    Created: 09/22/2025
    Author: Maaz Haque

    Description: Testing page for all backend methods to retrieve sports statistics and game data
*/

import { useState } from 'react';
import {
    getNFLGames,
    getSpecificNFLGameDetails,
    getSpecificNFLGameBoxscore,
    getUpcomingNFLGames
} from '@/backend_methods/nfl_methods';
import {
    getNBAGames,
    getSpecificNBAGameDetails,
    getSpecificNBAGameBoxscore,
    getSpecificNBATeamLastGame,
    getUpcomingNBAGames
} from '@/backend_methods/nba_methods';
import {
    getSoccerMatches,
    getSpecificSoccerMatchDetails,
    getSpecificSoccerMatchBoxscore,
    getUpcomingSoccerMatches
} from '@/backend_methods/soccer_methods';
import {
    getTodayAllGames,
    getTodayNBAGames,
    getTodayNFLGames,
    getTodaySoccerGames,
    getWeeklyAllGames,
    getWeeklyNBAGames,
    getWeeklyNFLGames,
    getWeeklySoccerGames,
    getLiveAllGames,
    getLiveNBAGames,
    getLiveNFLGames,
    getLiveSoccerGames,
    getLiveGamesStatus,
    getHistoricalAllGames,
    getHistoricalNBAGames,
    getHistoricalNFLGames,
    getHistoricalSoccerGames,
    refreshLiveData,
    getDashboardData,
    type HistoricalGameFilters,
    type StatisticalTrendsFilters,
    getStatisticalTrends,
    // New Historical Methods
    getHistoricalNBAAllTeams,
    getHistoricalNFLAllTeams,
    getHistoricalSoccerAllTeams,
    getHistoricalNBATeamByName,
    getHistoricalNFLTeamByName,
    getHistoricalSoccerTeamByName,
    getHistoricalNBASeason,
    getHistoricalNFLSeason,
    getHistoricalSoccerSeason,
    getNBATeamStats,
    getNFLTeamStats,
    getSoccerTeamStats,
    getHistoricalDashboardData
} from '@/backend_methods/sports_stats_methods';

interface TestResult {
    method: string;
    success: boolean;
    data?: any;
    error?: string;
    timestamp: Date;
}

export default function TestingPage() {
    const [results, setResults] = useState<TestResult[]>([]);
    const [loading, setLoading] = useState<string | null>(null);
    const [inputs, setInputs] = useState({
        nflGameId: '',
        nbaGameId: '',
        nbaTeamId: '',
        soccerMatchId: '',
        soccerLeague: 'MLS',
        days: '7',
        startDate: '',
        endDate: '',
        season: '',
        teamId: '',
        league: '',
        page: '1',
        perPage: '25',
        betType: 'all',
        // New inputs for historical methods
        nbaTeamName: '',
        nflTeamName: '',
        soccerTeamName: '',
        historicalSeason: '',
        statType: 'all'
    });

    const addResult = (method: string, success: boolean, data?: any, error?: string) => {
        const result: TestResult = {
            method,
            success,
            data,
            error,
            timestamp: new Date()
        };
        setResults(prev => [result, ...prev]);
    };

    const handleTest = async (methodName: string, method: () => Promise<any>) => {
        setLoading(methodName);
        try {
            const data = await method();
            addResult(methodName, true, data);
        } catch (error) {
            addResult(methodName, false, undefined, error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setLoading(null);
        }
    };

    const handleTestWithParam = async (
        methodName: string,
        method: (param: string) => Promise<any>,
        param: string,
        paramName: string
    ) => {
        if (!param.trim()) {
            addResult(methodName, false, undefined, `${paramName} is required`);
            return;
        }
        setLoading(methodName);
        try {
            const data = await method(param);
            addResult(methodName, true, data);
        } catch (error) {
            addResult(methodName, false, undefined, error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setLoading(null);
        }
    };

    const clearResults = () => {
        setResults([]);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Sports Statistics API Testing</h1>
                    <p className="text-lg text-gray-600">
                        Test all backend methods for retrieving sports statistics, game data, and performance metrics from the API.
                    </p>
                    <button
                        onClick={clearResults}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Clear Results
                    </button>
                </div>

                {/* NFL Methods */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">NFL Methods</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <button
                            onClick={() => handleTest('getNFLGames', getNFLGames)}
                            disabled={loading === 'getNFLGames'}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                        >
                            {loading === 'getNFLGames' ? 'Loading...' : 'Get NFL Games'}
                        </button>
                        <button
                            onClick={() => handleTest('getUpcomingNFLGames', getUpcomingNFLGames)}
                            disabled={loading === 'getUpcomingNFLGames'}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                        >
                            {loading === 'getUpcomingNFLGames' ? 'Loading...' : 'Get Upcoming NFL Games'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                NFL Game ID
                            </label>
                            <input
                                type="text"
                                value={inputs.nflGameId}
                                onChange={(e) => setInputs(prev => ({ ...prev, nflGameId: e.target.value }))}
                                placeholder="Enter NFL game ID"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => handleTestWithParam('getSpecificNFLGameDetails', getSpecificNFLGameDetails, inputs.nflGameId, 'NFL Game ID')}
                                disabled={loading === 'getSpecificNFLGameDetails'}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                            >
                                {loading === 'getSpecificNFLGameDetails' ? 'Loading...' : 'Get NFL Game Details'}
                            </button>
                            <button
                                onClick={() => handleTestWithParam('getSpecificNFLGameBoxscore', getSpecificNFLGameBoxscore, inputs.nflGameId, 'NFL Game ID')}
                                disabled={loading === 'getSpecificNFLGameBoxscore'}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                            >
                                {loading === 'getSpecificNFLGameBoxscore' ? 'Loading...' : 'Get NFL Game Boxscore'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* NBA Methods */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">NBA Methods</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <button
                            onClick={() => handleTest('getNBAGames', getNBAGames)}
                            disabled={loading === 'getNBAGames'}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                        >
                            {loading === 'getNBAGames' ? 'Loading...' : 'Get NBA Games'}
                        </button>
                        <button
                            onClick={() => handleTest('getUpcomingNBAGames', getUpcomingNBAGames)}
                            disabled={loading === 'getUpcomingNBAGames'}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                        >
                            {loading === 'getUpcomingNBAGames' ? 'Loading...' : 'Get Upcoming NBA Games'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    NBA Game ID
                                </label>
                                <input
                                    type="text"
                                    value={inputs.nbaGameId}
                                    onChange={(e) => setInputs(prev => ({ ...prev, nbaGameId: e.target.value }))}
                                    placeholder="Enter NBA game ID"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    NBA Team ID
                                </label>
                                <input
                                    type="text"
                                    value={inputs.nbaTeamId}
                                    onChange={(e) => setInputs(prev => ({ ...prev, nbaTeamId: e.target.value }))}
                                    placeholder="Enter NBA team ID"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => handleTestWithParam('getSpecificNBAGameDetails', getSpecificNBAGameDetails, inputs.nbaGameId, 'NBA Game ID')}
                                disabled={loading === 'getSpecificNBAGameDetails'}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                            >
                                {loading === 'getSpecificNBAGameDetails' ? 'Loading...' : 'Get NBA Game Details'}
                            </button>
                            <button
                                onClick={() => handleTestWithParam('getSpecificNBAGameBoxscore', getSpecificNBAGameBoxscore, inputs.nbaGameId, 'NBA Game ID')}
                                disabled={loading === 'getSpecificNBAGameBoxscore'}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                            >
                                {loading === 'getSpecificNBAGameBoxscore' ? 'Loading...' : 'Get NBA Game Boxscore'}
                            </button>
                            <button
                                onClick={() => handleTestWithParam('getSpecificNBATeamLastGame', getSpecificNBATeamLastGame, inputs.nbaTeamId, 'NBA Team ID')}
                                disabled={loading === 'getSpecificNBATeamLastGame'}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                            >
                                {loading === 'getSpecificNBATeamLastGame' ? 'Loading...' : 'Get NBA Team Last Game'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Soccer Methods */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Soccer Methods</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <button
                            onClick={() => handleTest('getSoccerMatches', getSoccerMatches)}
                            disabled={loading === 'getSoccerMatches'}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors"
                        >
                            {loading === 'getSoccerMatches' ? 'Loading...' : 'Get Soccer Matches'}
                        </button>
                        <button
                            onClick={() => handleTest('getUpcomingSoccerMatches', getUpcomingSoccerMatches)}
                            disabled={loading === 'getUpcomingSoccerMatches'}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors"
                        >
                            {loading === 'getUpcomingSoccerMatches' ? 'Loading...' : 'Get Upcoming Soccer Matches'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Soccer Match ID
                            </label>
                            <input
                                type="text"
                                value={inputs.soccerMatchId}
                                onChange={(e) => setInputs(prev => ({ ...prev, soccerMatchId: e.target.value }))}
                                placeholder="Enter soccer match ID"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => handleTestWithParam('getSpecificSoccerMatchDetails', getSpecificSoccerMatchDetails, inputs.soccerMatchId, 'Soccer Match ID')}
                                disabled={loading === 'getSpecificSoccerMatchDetails'}
                                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-teal-400 transition-colors"
                            >
                                {loading === 'getSpecificSoccerMatchDetails' ? 'Loading...' : 'Get Soccer Match Details'}
                            </button>
                            <button
                                onClick={() => handleTestWithParam('getSpecificSoccerMatchBoxscore', getSpecificSoccerMatchBoxscore, inputs.soccerMatchId, 'Soccer Match ID')}
                                disabled={loading === 'getSpecificSoccerMatchBoxscore'}
                                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-teal-400 transition-colors"
                            >
                                {loading === 'getSpecificSoccerMatchBoxscore' ? 'Loading...' : 'Get Soccer Match Boxscore'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sports Statistics Analysis Methods */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Sports Statistics Analysis Methods</h2>
                    
                    {/* Today's Games Section */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Games</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <button
                                onClick={() => handleTest('getTodayAllGames', () => getTodayAllGames(true, ['MLS', 'EPL', 'LaLiga']))}
                                disabled={loading === 'getTodayAllGames'}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                            >
                                {loading === 'getTodayAllGames' ? 'Loading...' : 'Today All Games'}
                            </button>
                            <button
                                onClick={() => handleTest('getTodayNBAGames', getTodayNBAGames)}
                                disabled={loading === 'getTodayNBAGames'}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                            >
                                {loading === 'getTodayNBAGames' ? 'Loading...' : 'Today NBA Games'}
                            </button>
                            <button
                                onClick={() => handleTest('getTodayNFLGames', getTodayNFLGames)}
                                disabled={loading === 'getTodayNFLGames'}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                            >
                                {loading === 'getTodayNFLGames' ? 'Loading...' : 'Today NFL Games'}
                            </button>
                            <button
                                onClick={() => handleTest('getTodaySoccerGames', () => getTodaySoccerGames(inputs.soccerLeague))}
                                disabled={loading === 'getTodaySoccerGames'}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors"
                            >
                                {loading === 'getTodaySoccerGames' ? 'Loading...' : 'Today Soccer Games'}
                            </button>
                        </div>
                    </div>

                    {/* Weekly Games Section */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Games</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Days Ahead</label>
                                <input
                                    type="number"
                                    value={inputs.days}
                                    onChange={(e) => setInputs(prev => ({ ...prev, days: e.target.value }))}
                                    placeholder="Days ahead (default: 7)"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Soccer League</label>
                                <select
                                    value={inputs.soccerLeague}
                                    onChange={(e) => setInputs(prev => ({ ...prev, soccerLeague: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="MLS">MLS</option>
                                    <option value="EPL">EPL</option>
                                    <option value="LaLiga">LaLiga</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <button
                                onClick={() => handleTest('getWeeklyAllGames', () => getWeeklyAllGames(parseInt(inputs.days) || 7, ['MLS', 'EPL', 'LaLiga']))}
                                disabled={loading === 'getWeeklyAllGames'}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                            >
                                {loading === 'getWeeklyAllGames' ? 'Loading...' : 'Weekly All Games'}
                            </button>
                            <button
                                onClick={() => handleTest('getWeeklyNBAGames', () => getWeeklyNBAGames(parseInt(inputs.days) || 7))}
                                disabled={loading === 'getWeeklyNBAGames'}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                            >
                                {loading === 'getWeeklyNBAGames' ? 'Loading...' : 'Weekly NBA Games'}
                            </button>
                            <button
                                onClick={() => handleTest('getWeeklyNFLGames', () => getWeeklyNFLGames(parseInt(inputs.days) || 7))}
                                disabled={loading === 'getWeeklyNFLGames'}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                            >
                                {loading === 'getWeeklyNFLGames' ? 'Loading...' : 'Weekly NFL Games'}
                            </button>
                            <button
                                onClick={() => handleTest('getWeeklySoccerGames', () => getWeeklySoccerGames(parseInt(inputs.days) || 7, [inputs.soccerLeague]))}
                                disabled={loading === 'getWeeklySoccerGames'}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors"
                            >
                                {loading === 'getWeeklySoccerGames' ? 'Loading...' : 'Weekly Soccer Games'}
                            </button>
                        </div>
                    </div>

                    {/* Live Games Section */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Games</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <button
                                onClick={() => handleTest('getLiveAllGames', () => getLiveAllGames(['MLS', 'EPL', 'LaLiga']))}
                                disabled={loading === 'getLiveAllGames'}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors"
                            >
                                {loading === 'getLiveAllGames' ? 'Loading...' : 'Live All Games'}
                            </button>
                            <button
                                onClick={() => handleTest('getLiveNBAGames', getLiveNBAGames)}
                                disabled={loading === 'getLiveNBAGames'}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                            >
                                {loading === 'getLiveNBAGames' ? 'Loading...' : 'Live NBA Games'}
                            </button>
                            <button
                                onClick={() => handleTest('getLiveNFLGames', getLiveNFLGames)}
                                disabled={loading === 'getLiveNFLGames'}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                            >
                                {loading === 'getLiveNFLGames' ? 'Loading...' : 'Live NFL Games'}
                            </button>
                            <button
                                onClick={() => handleTest('getLiveSoccerGames', () => getLiveSoccerGames([inputs.soccerLeague]))}
                                disabled={loading === 'getLiveSoccerGames'}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors"
                            >
                                {loading === 'getLiveSoccerGames' ? 'Loading...' : 'Live Soccer Games'}
                            </button>
                            <button
                                onClick={() => handleTest('getLiveGamesStatus', getLiveGamesStatus)}
                                disabled={loading === 'getLiveGamesStatus'}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400 transition-colors"
                            >
                                {loading === 'getLiveGamesStatus' ? 'Loading...' : 'Live Status'}
                            </button>
                        </div>
                    </div>

                    {/* Historical Data Section */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Historical Data</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={inputs.startDate}
                                    onChange={(e) => setInputs(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={inputs.endDate}
                                    onChange={(e) => setInputs(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Season</label>
                                <input
                                    type="text"
                                    value={inputs.season}
                                    onChange={(e) => setInputs(prev => ({ ...prev, season: e.target.value }))}
                                    placeholder="e.g., 2024, 2023-24"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Team ID</label>
                                <input
                                    type="text"
                                    value={inputs.teamId}
                                    onChange={(e) => setInputs(prev => ({ ...prev, teamId: e.target.value }))}
                                    placeholder="Filter by team ID"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">League</label>
                                <select
                                    value={inputs.league}
                                    onChange={(e) => setInputs(prev => ({ ...prev, league: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Leagues</option>
                                    <option value="NBA">NBA</option>
                                    <option value="NFL">NFL</option>
                                    <option value="Soccer">Soccer</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Per Page</label>
                                <input
                                    type="number"
                                    value={inputs.perPage}
                                    onChange={(e) => setInputs(prev => ({ ...prev, perPage: e.target.value }))}
                                    placeholder="Items per page"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <button
                                onClick={() => handleTest('getHistoricalAllGames', () => {
                                    const filters: HistoricalGameFilters = {
                                        startDate: inputs.startDate || undefined,
                                        endDate: inputs.endDate || undefined,
                                        season: inputs.season || undefined,
                                        teamId: inputs.teamId || undefined,
                                        league: inputs.league || undefined,
                                        page: parseInt(inputs.page) || 1,
                                        perPage: parseInt(inputs.perPage) || 25,
                                        soccerLeagues: ['MLS', 'EPL', 'LaLiga']
                                    };
                                    return getHistoricalAllGames(filters);
                                })}
                                disabled={loading === 'getHistoricalAllGames'}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                            >
                                {loading === 'getHistoricalAllGames' ? 'Loading...' : 'Historical All Games'}
                            </button>
                            <button
                                onClick={() => handleTest('getHistoricalNBAGames', () => {
                                    const filters: HistoricalGameFilters = {
                                        startDate: inputs.startDate || undefined,
                                        endDate: inputs.endDate || undefined,
                                        season: inputs.season || undefined,
                                        teamId: inputs.teamId || undefined,
                                        page: parseInt(inputs.page) || 1,
                                        perPage: parseInt(inputs.perPage) || 25
                                    };
                                    return getHistoricalNBAGames(filters);
                                })}
                                disabled={loading === 'getHistoricalNBAGames'}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                            >
                                {loading === 'getHistoricalNBAGames' ? 'Loading...' : 'Historical NBA Games'}
                            </button>
                            <button
                                onClick={() => handleTest('getHistoricalNFLGames', () => {
                                    const filters: HistoricalGameFilters = {
                                        startDate: inputs.startDate || undefined,
                                        endDate: inputs.endDate || undefined,
                                        season: inputs.season || undefined,
                                        teamId: inputs.teamId || undefined,
                                        page: parseInt(inputs.page) || 1,
                                        perPage: parseInt(inputs.perPage) || 25
                                    };
                                    return getHistoricalNFLGames(filters);
                                })}
                                disabled={loading === 'getHistoricalNFLGames'}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                            >
                                {loading === 'getHistoricalNFLGames' ? 'Loading...' : 'Historical NFL Games'}
                            </button>
                            <button
                                onClick={() => handleTest('getHistoricalSoccerGames', () => {
                                    const filters: HistoricalGameFilters = {
                                        startDate: inputs.startDate || undefined,
                                        endDate: inputs.endDate || undefined,
                                        teamId: inputs.teamId || undefined,
                                        page: parseInt(inputs.page) || 1,
                                        perPage: parseInt(inputs.perPage) || 25,
                                        soccerLeagues: [inputs.soccerLeague]
                                    };
                                    return getHistoricalSoccerGames(filters);
                                })}
                                disabled={loading === 'getHistoricalSoccerGames'}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors"
                            >
                                {loading === 'getHistoricalSoccerGames' ? 'Loading...' : 'Historical Soccer Games'}
                            </button>
                        </div>
                    </div>

                    {/* Statistical Trends & Utility Section */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistical Trends & Utilities</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Statistical Type</label>
                                <select
                                    value={inputs.betType}
                                    onChange={(e) => setInputs(prev => ({ ...prev, betType: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All Statistics</option>
                                    <option value="scoring">Scoring</option>
                                    <option value="defensive">Defensive</option>
                                    <option value="team_performance">Team Performance</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <button
                                onClick={() => handleTest('getStatisticalTrends', () => {
                                    const filters: StatisticalTrendsFilters = {
                                        league: inputs.league || undefined,
                                        teamId: inputs.teamId || undefined,
                                        startDate: inputs.startDate || undefined,
                                        endDate: inputs.endDate || undefined,
                                        statType: inputs.betType
                                    };
                                    return getStatisticalTrends(filters);
                                })}
                                disabled={loading === 'getStatisticalTrends'}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-yellow-400 transition-colors"
                            >
                                {loading === 'getStatisticalTrends' ? 'Loading...' : 'Statistical Trends'}
                            </button>
                            <button
                                onClick={() => handleTest('refreshLiveData', refreshLiveData)}
                                disabled={loading === 'refreshLiveData'}
                                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-cyan-400 transition-colors"
                            >
                                {loading === 'refreshLiveData' ? 'Loading...' : 'Refresh Live Data'}
                            </button>
                            <button
                                onClick={() => handleTest('getDashboardData', getDashboardData)}
                                disabled={loading === 'getDashboardData'}
                                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:bg-slate-400 transition-colors"
                            >
                                {loading === 'getDashboardData' ? 'Loading...' : 'Dashboard Data'}
                            </button>
                            <button
                                onClick={() => handleTest('getHistoricalDashboardData', getHistoricalDashboardData)}
                                disabled={loading === 'getHistoricalDashboardData'}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                            >
                                {loading === 'getHistoricalDashboardData' ? 'Loading...' : 'Historical Dashboard'}
                            </button>
                        </div>
                    </div>

                    {/* New Historical Data Testing Section */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Enhanced Historical Data Testing</h3>
                        
                        {/* Team Name Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">NBA Team Name</label>
                                <input
                                    type="text"
                                    value={inputs.nbaTeamName}
                                    onChange={(e) => setInputs(prev => ({ ...prev, nbaTeamName: e.target.value }))}
                                    placeholder="e.g., 'Los Angeles Lakers', 'lakers'"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">NFL Team Name</label>
                                <input
                                    type="text"
                                    value={inputs.nflTeamName}
                                    onChange={(e) => setInputs(prev => ({ ...prev, nflTeamName: e.target.value }))}
                                    placeholder="e.g., 'Kansas City Chiefs', 'chiefs'"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Soccer Team Name</label>
                                <input
                                    type="text"
                                    value={inputs.soccerTeamName}
                                    onChange={(e) => setInputs(prev => ({ ...prev, soccerTeamName: e.target.value }))}
                                    placeholder="e.g., 'Inter Miami', 'LAFC'"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Additional Historical Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Historical Season</label>
                                <input
                                    type="text"
                                    value={inputs.historicalSeason}
                                    onChange={(e) => setInputs(prev => ({ ...prev, historicalSeason: e.target.value }))}
                                    placeholder="e.g., '2023-24' for NBA, '2023' for NFL/Soccer"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Team Stats Type</label>
                                <select
                                    value={inputs.statType}
                                    onChange={(e) => setInputs(prev => ({ ...prev, statType: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="all">All Stats</option>
                                    <option value="wins">Wins</option>
                                    <option value="losses">Losses</option>
                                    <option value="scoring">Scoring</option>
                                    <option value="defensive">Defensive</option>
                                </select>
                            </div>
                        </div>

                        {/* All Teams Historical Data */}
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-700 mb-3">All Teams Historical Data</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => handleTest('getHistoricalNBAAllTeams', () => {
                                        const season = inputs.historicalSeason || undefined;
                                        return getHistoricalNBAAllTeams(season);
                                    })}
                                    disabled={loading === 'getHistoricalNBAAllTeams'}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                                >
                                    {loading === 'getHistoricalNBAAllTeams' ? 'Loading...' : 'NBA All Teams Historical'}
                                </button>
                                <button
                                    onClick={() => handleTest('getHistoricalNFLAllTeams', () => {
                                        const season = inputs.historicalSeason || undefined;
                                        return getHistoricalNFLAllTeams(season);
                                    })}
                                    disabled={loading === 'getHistoricalNFLAllTeams'}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                                >
                                    {loading === 'getHistoricalNFLAllTeams' ? 'Loading...' : 'NFL All Teams Historical'}
                                </button>
                                <button
                                    onClick={() => handleTest('getHistoricalSoccerAllTeams', () => {
                                        const leagues = [inputs.soccerLeague];
                                        return getHistoricalSoccerAllTeams(leagues);
                                    })}
                                    disabled={loading === 'getHistoricalSoccerAllTeams'}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors"
                                >
                                    {loading === 'getHistoricalSoccerAllTeams' ? 'Loading...' : 'Soccer All Teams Historical'}
                                </button>
                            </div>
                        </div>

                        {/* Team by Name Historical Data */}
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-700 mb-3">Team by Name Historical Data</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => handleTestWithParam('getHistoricalNBATeamByName', (teamName: string) => {
                                        const options = {
                                            season: inputs.historicalSeason || undefined,
                                            startDate: inputs.startDate || undefined,
                                            endDate: inputs.endDate || undefined
                                        };
                                        return getHistoricalNBATeamByName(teamName, options);
                                    }, inputs.nbaTeamName, 'NBA Team Name')}
                                    disabled={loading === 'getHistoricalNBATeamByName'}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                                >
                                    {loading === 'getHistoricalNBATeamByName' ? 'Loading...' : 'NBA Team by Name'}
                                </button>
                                <button
                                    onClick={() => handleTestWithParam('getHistoricalNFLTeamByName', (teamName: string) => {
                                        const options = {
                                            season: inputs.historicalSeason || undefined,
                                            startDate: inputs.startDate || undefined,
                                            endDate: inputs.endDate || undefined
                                        };
                                        return getHistoricalNFLTeamByName(teamName, options);
                                    }, inputs.nflTeamName, 'NFL Team Name')}
                                    disabled={loading === 'getHistoricalNFLTeamByName'}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                                >
                                    {loading === 'getHistoricalNFLTeamByName' ? 'Loading...' : 'NFL Team by Name'}
                                </button>
                                <button
                                    onClick={() => handleTestWithParam('getHistoricalSoccerTeamByName', (teamName: string) => {
                                        const options = {
                                            leagues: [inputs.soccerLeague],
                                            startDate: inputs.startDate || undefined,
                                            endDate: inputs.endDate || undefined
                                        };
                                        return getHistoricalSoccerTeamByName(teamName, options);
                                    }, inputs.soccerTeamName, 'Soccer Team Name')}
                                    disabled={loading === 'getHistoricalSoccerTeamByName'}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors"
                                >
                                    {loading === 'getHistoricalSoccerTeamByName' ? 'Loading...' : 'Soccer Team by Name'}
                                </button>
                            </div>
                        </div>

                        {/* Season Historical Data */}
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-700 mb-3">Season Historical Data</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => handleTestWithParam('getHistoricalNBASeason', (season: string) => {
                                        const options = {
                                            teamName: inputs.nbaTeamName || undefined,
                                            startDate: inputs.startDate || undefined,
                                            endDate: inputs.endDate || undefined
                                        };
                                        return getHistoricalNBASeason(season, options);
                                    }, inputs.historicalSeason, 'Historical Season')}
                                    disabled={loading === 'getHistoricalNBASeason'}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                                >
                                    {loading === 'getHistoricalNBASeason' ? 'Loading...' : 'NBA Season Data'}
                                </button>
                                <button
                                    onClick={() => handleTestWithParam('getHistoricalNFLSeason', (season: string) => {
                                        const options = {
                                            teamName: inputs.nflTeamName || undefined,
                                            startDate: inputs.startDate || undefined,
                                            endDate: inputs.endDate || undefined
                                        };
                                        return getHistoricalNFLSeason(season, options);
                                    }, inputs.historicalSeason, 'Historical Season')}
                                    disabled={loading === 'getHistoricalNFLSeason'}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                                >
                                    {loading === 'getHistoricalNFLSeason' ? 'Loading...' : 'NFL Season Data'}
                                </button>
                                <button
                                    onClick={() => handleTestWithParam('getHistoricalSoccerSeason', (season: string) => {
                                        const options = {
                                            teamName: inputs.soccerTeamName || undefined,
                                            leagues: [inputs.soccerLeague],
                                            startDate: inputs.startDate || undefined,
                                            endDate: inputs.endDate || undefined
                                        };
                                        return getHistoricalSoccerSeason(season, options);
                                    }, inputs.historicalSeason, 'Historical Season')}
                                    disabled={loading === 'getHistoricalSoccerSeason'}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors"
                                >
                                    {loading === 'getHistoricalSoccerSeason' ? 'Loading...' : 'Soccer Season Data'}
                                </button>
                            </div>
                        </div>

                        {/* Team Stats */}
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-700 mb-3">Team Performance Stats</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => handleTest('getNBATeamStats', () => {
                                        const options = {
                                            teamName: inputs.nbaTeamName || undefined,
                                            season: inputs.historicalSeason || undefined,
                                            statType: inputs.statType
                                        };
                                        return getNBATeamStats(options);
                                    })}
                                    disabled={loading === 'getNBATeamStats'}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                                >
                                    {loading === 'getNBATeamStats' ? 'Loading...' : 'NBA Team Stats'}
                                </button>
                                <button
                                    onClick={() => handleTest('getNFLTeamStats', () => {
                                        const options = {
                                            teamName: inputs.nflTeamName || undefined,
                                            season: inputs.historicalSeason || undefined,
                                            statType: inputs.statType
                                        };
                                        return getNFLTeamStats(options);
                                    })}
                                    disabled={loading === 'getNFLTeamStats'}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                                >
                                    {loading === 'getNFLTeamStats' ? 'Loading...' : 'NFL Team Stats'}
                                </button>
                                <button
                                    onClick={() => handleTest('getSoccerTeamStats', () => {
                                        const options = {
                                            teamName: inputs.soccerTeamName || undefined,
                                            leagues: [inputs.soccerLeague],
                                            statType: inputs.statType
                                        };
                                        return getSoccerTeamStats(options);
                                    })}
                                    disabled={loading === 'getSoccerTeamStats'}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors"
                                >
                                    {loading === 'getSoccerTeamStats' ? 'Loading...' : 'Soccer Team Stats'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Results</h2>
                    {results.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No tests run yet. Click a button above to test a method.</p>
                    ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {results.map((result, index) => (
                                <div
                                    key={index}
                                    className={`p-4 rounded-lg border ${
                                        result.success
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-red-50 border-red-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900">{result.method}</h3>
                                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                                            result.success
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {result.success ? 'SUCCESS' : 'FAILED'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {result.timestamp.toLocaleTimeString()}
                                    </p>
                                    {result.success ? (
                                        <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto max-h-48 overflow-y-auto">
                                            {JSON.stringify(result.data, null, 2)}
                                        </pre>
                                    ) : (
                                        <p className="text-red-700 font-medium">{result.error}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}