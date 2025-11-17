/**
 * GameCard component for displaying individual game information
 * Author: Maaz Haque
 * Purpose: Displays game details in a card format with team names, scores, and status
 */

/*
import { GameData } from '@/lib/api/sports';

interface GameCardProps {
  game: GameData;
  league: string;
}

export default function GameCard({ game, league }: GameCardProps) {
  // Handle different data formats from different leagues
  const renderNBAGame = (game: GameData) => (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">NBA</span>
        <span className="text-sm text-gray-500">{game.game_date}</span>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-center">
          <div className="text-sm text-gray-600">Visitor</div>
          <div className="font-semibold">{game.visitor_team_id || 'TBD'}</div>
        </div>
        
        <div className="text-center mx-4">
          <div className="text-xs text-gray-500">VS</div>
          <div className="text-sm font-medium text-gray-700">{game.game_status || 'Scheduled'}</div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-gray-600">Home</div>
          <div className="font-semibold">{game.home_team_id || 'TBD'}</div>
        </div>
      </div>
    </div>
  );

  const renderESPNGame = (game: GameData, leagueColor: string, leagueBg: string) => {
    const competition = game.competitions?.[0];
    const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home');
    const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away');
    const status = competition?.status;

    return (
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-center mb-3">
          <span className={`text-sm font-medium ${leagueColor} ${leagueBg} px-2 py-1 rounded`}>
            {league}
          </span>
          <span className="text-sm text-gray-500">
            {status?.type?.completed ? 'Final' : (status?.displayClock || 'Scheduled')}
          </span>
        </div>
        
        <div className="space-y-2">
          {/* Away Team *///}
          /*
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {awayTeam?.team?.logo && (
                <img 
                  src={awayTeam.team.logo} 
                  alt={awayTeam.team.displayName}
                  className="w-8 h-8 object-contain"
                />
              )}
              <div>
                <div className="font-semibold text-gray-900">
                  {awayTeam?.team?.displayName || 'TBD'}
                </div>
                <div className="text-sm text-gray-500">
                  {awayTeam?.team?.abbreviation}
                </div>
              </div>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {awayTeam?.score || '-'}
            </div>
          </div>
          
          {/* Home Team *///}
          /*
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {homeTeam?.team?.logo && (
                <img 
                  src={homeTeam.team.logo} 
                  alt={homeTeam.team.displayName}
                  className="w-8 h-8 object-contain"
                />
              )}
              <div>
                <div className="font-semibold text-gray-900">
                  {homeTeam?.team?.displayName || 'TBD'}
                </div>
                <div className="text-sm text-gray-500">
                  {homeTeam?.team?.abbreviation}
                </div>
              </div>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {homeTeam?.score || '-'}
            </div>
          </div>
        </div>
        
        {game.name && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-sm text-gray-600 truncate">{game.name}</div>
          </div>
        )}
      </div>
    );
  };

  // Render based on league
  if (league === 'NBA') {
    return renderNBAGame(game);
  } else if (league === 'NFL') {
    return renderESPNGame(game, 'text-green-600', 'bg-green-100');
  } else {
    // Soccer
    return renderESPNGame(game, 'text-orange-600', 'bg-orange-100');
  }
}
  */