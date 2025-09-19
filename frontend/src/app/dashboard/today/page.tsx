/**
 * Today's Games page
 * Author: Maaz Haque
 * Purpose: Main page component that displays all of today's games from all leagues
 */

'use client';

import { useState, useEffect } from 'react';
import { TodayGamesResponse, fetchTodayGames } from '@/lib/api/sports';
import LeagueSection from '@/components/LeagueSection';

export default function TodayGamesPage() {
  const [gamesData, setGamesData] = useState<TodayGamesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadGames = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch games for multiple soccer leagues
      const data = await fetchTodayGames(['MLS', 'EPL', 'LaLiga']);
      setGamesData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Today';
    
    try {
      // Handle different date formats
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Today's Games
              </h1>
              <p className="text-lg text-gray-600">
                {formatDate(gamesData?.date || null)}
              </p>
            </div>
            
            <button
              onClick={loadGames}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <svg 
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {formatTime(lastUpdated)}
            </p>
          )}
        </div>

        {/* Summary Stats */}
        {gamesData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-900">
                {gamesData.summary.total_games}
              </div>
              <div className="text-sm text-gray-600">Total Games</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">
                {gamesData.summary.nba_games}
              </div>
              <div className="text-sm text-gray-600">NBA Games</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">
                {gamesData.summary.nfl_games}
              </div>
              <div className="text-sm text-gray-600">NFL Games</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-orange-600">
                {gamesData.summary.soccer_games}
              </div>
              <div className="text-sm text-gray-600">Soccer Games</div>
            </div>
          </div>
        )}

        {/* Global Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* League Sections */}
        {gamesData ? (
          <div className="space-y-8">
            <LeagueSection
              leagueName="NBA"
              games={gamesData.leagues.NBA.games}
              error={gamesData.leagues.NBA.error}
              isLoading={false}
            />
            
            <LeagueSection
              leagueName="NFL"
              games={gamesData.leagues.NFL.games}
              error={gamesData.leagues.NFL.error}
              isLoading={false}
            />
            
            <LeagueSection
              leagueName="Soccer"
              games={gamesData.leagues.Soccer.games}
              error={gamesData.leagues.Soccer.error}
              isLoading={false}
            />
          </div>
        ) : isLoading ? (
          <div className="space-y-8">
            <LeagueSection
              leagueName="NBA"
              games={[]}
              error={null}
              isLoading={true}
            />
            <LeagueSection
              leagueName="NFL"
              games={[]}
              error={null}
              isLoading={true}
            />
            <LeagueSection
              leagueName="Soccer"
              games={[]}
              error={null}
              isLoading={true}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No games data available</h3>
            <p className="text-gray-600">Try refreshing the page to load today's games.</p>
          </div>
        )}
      </div>
    </div>
  );
}