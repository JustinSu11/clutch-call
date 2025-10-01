/**
 * LeagueSection component for displaying games grouped by league
 * Author: Maaz Haque
 * Purpose: Groups and displays games by league with error handling
 */

import { GameData } from '@/lib/api/sports';
import GameCard from './GameCard';

interface LeagueSectionProps {
  leagueName: string;
  games: GameData[];
  error: string | null;
  isLoading?: boolean;
}

export default function LeagueSection({ leagueName, games, error, isLoading }: LeagueSectionProps) {
  const getLeagueColor = (league: string) => {
    switch (league) {
      case 'NBA':
        return 'text-blue-600';
      case 'NFL':
        return 'text-green-600';
      case 'Soccer':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getLeagueIcon = (league: string) => {
    switch (league) {
      case 'NBA':
        return '🏀';
      case 'NFL':
        return '🏈';
      case 'Soccer':
        return '⚽';
      default:
        return '🏆';
    }
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-2">{getLeagueIcon(leagueName)}</span>
          <h2 className={`text-2xl font-bold ${getLeagueColor(leagueName)}`}>
            {leagueName}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Loading skeletons */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-8 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-2">{getLeagueIcon(leagueName)}</span>
          <h2 className={`text-2xl font-bold ${getLeagueColor(leagueName)}`}>
            {leagueName}
          </h2>
          <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
            {games.length} game{games.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 text-sm">
              Error loading {leagueName} games: {error}
            </span>
          </div>
        </div>
      )}

      {games.length === 0 && !error ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-4xl mb-2">{getLeagueIcon(leagueName)}</div>
          <p className="text-gray-600">No {leagueName} games scheduled for today</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game, index) => (
            <GameCard 
              key={game.game_id || game.id || index} 
              game={game} 
              league={leagueName} 
            />
          ))}
        </div>
      )}
    </div>
  );
}