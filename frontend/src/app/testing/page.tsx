'use client';

/*
    File: src/app/testing/page.tsx
    Created: 09/22/2025
    Author: Maaz Haque

    Description: Testing page for all backend methods to retrieve sports data
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
        soccerMatchId: ''
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
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Backend Methods Testing</h1>
                    <p className="text-lg text-gray-600">
                        Test all backend methods for retrieving sports data from the API.
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