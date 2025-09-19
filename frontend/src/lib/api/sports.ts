/**
 * API utility functions for fetching sports data
 * Author: Maaz Haque
 * Purpose: Provides functions to fetch today's games from the backend API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface GameData {
  game_id: string;
  game_date: string;
  home_team_id?: string;
  visitor_team_id?: string;
  game_status?: string;
  league: string;
  // ESPN format for NFL/Soccer
  id?: string;
  name?: string;
  competitions?: Array<{
    competitors: Array<{
      team: {
        displayName: string;
        abbreviation: string;
        logo: string;
      };
      homeAway: string;
      score: string;
    }>;
    status: {
      type: {
        description: string;
        completed: boolean;
      };
      displayClock?: string;
    };
  }>;
}

export interface TodayGamesResponse {
  date: string;
  leagues: {
    NBA: {
      games: GameData[];
      error: string | null;
    };
    NFL: {
      games: GameData[];
      error: string | null;
    };
    Soccer: {
      games: GameData[];
      error: string | null;
    };
  };
  summary: {
    total_games: number;
    nba_games: number;
    nfl_games: number;
    soccer_games: number;
  };
}

/**
 * Fetch today's games from all leagues
 */
export async function fetchTodayGames(soccerLeagues?: string[]): Promise<TodayGamesResponse> {
  const url = new URL(`${API_BASE_URL}/today/`);
  
  if (soccerLeagues) {
    soccerLeagues.forEach(league => {
      url.searchParams.append('soccer_leagues', league);
    });
  }

  console.log('Fetching today\'s games from:', url.toString());

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched today\'s games:', data);
    return data;
  } catch (error) {
    console.error('Error fetching today\'s games:', error);
    throw error;
  }
}

/**
 * Fetch today's NBA games only
 */
export async function fetchNBAToday(): Promise<{ data: GameData[] }> {
  const response = await fetch(`${API_BASE_URL}/today/nba/`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch NBA games: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch today's NFL games only
 */
export async function fetchNFLToday(): Promise<{ events: GameData[] }> {
  const response = await fetch(`${API_BASE_URL}/today/nfl/`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch NFL games: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch today's Soccer games for a specific league
 */
export async function fetchSoccerToday(league: string = 'MLS'): Promise<{ events: GameData[] }> {
  const response = await fetch(`${API_BASE_URL}/today/soccer/?league=${league}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Soccer games: ${response.statusText}`);
  }
  
  return response.json();
}