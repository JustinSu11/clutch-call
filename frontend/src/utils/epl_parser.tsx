/*
    File: frontend/src/utils/epl_parser.tsx
    Created: 11/08/2025 by Claude Code
    Description: This file contains methods to parse EPL match data
    from the EPL prediction model backend endpoints.
*/

import { getEPLUpcomingMatches } from '../backend_methods/soccer_methods';
import { UpcomingGame, Team } from './data_class';
import { makeBackendRequest, ROUTES, checkBackendHealth } from '../backend_methods/helpers/backend_routing';

export const parseUpcomingEPLGames = async (): Promise<UpcomingGame[]> => {
    /*
        parseUpcomingEPLGames:
        This method gets the upcoming EPL games from the EPL prediction model
        and parses the response to return the upcoming games.

        returns:
            games: an array where each subscript has its own homeTeam and awayTeam
    */

    try {
        // await the response from the EPL backend method
        const responseData = await getEPLUpcomingMatches();

        // parse the matches array from the EPL model response
        const matches = responseData.matches || [];

        // map through each match to convert to UpcomingGame format
        const games: UpcomingGame[] = matches.map((match: unknown) => {
            const typedMatch = match as { home_team: string; away_team: string; date: string; match_id: number; matchday: number };
            
            // Create team objects for EPL teams
            const homeTeam: Team = {
                abbreviation: typedMatch.home_team.substring(0, 3).toUpperCase(), // Use first 3 letters as abbreviation
                color: '#003399', // Default EPL blue
                alternateColor: '#ffffff', // Default white
                displayName: typedMatch.home_team,
            };
            
            const awayTeam: Team = {
                abbreviation: typedMatch.away_team.substring(0, 3).toUpperCase(), // Use first 3 letters as abbreviation
                color: '#ff0000', // Default EPL red
                alternateColor: '#ffffff', // Default white
                displayName: typedMatch.away_team,
            };

            // Parse the date from ISO format
            const gameDate = new Date(typedMatch.date);
            const formattedGameDate = gameDate.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            });

            const league = "EPL";

            return {
                homeTeam,
                awayTeam,
                gameDate: formattedGameDate,
                dateAndTime: typedMatch.date,
                league: league
            };
        });

        return games;

    } catch (error) {
        console.error('Error parsing EPL games:', error);
        return []; // Return empty array if there's an error
    }
};

export const parseEPLPreviousGameStats = async (teamName: string) => {
    /*
        parseEPLPreviousGameStats:
        This method gets previous game stats for a given EPL team.
        
        For now, returns placeholder data since we don't have detailed EPL stats parsing
        
        params:
            teamName: string - the full display name of the team (e.g., "Arsenal")
        returns:
            Array of numbers for chart visualization (matches NFL parser format)
    */
    
    // Return placeholder stats as numbers for EPL teams (goals scored in last 5 games)
    return [2, 1, 3, 0, 2]; // Sample goals scored per game
};

export const getEPLMatchPrediction = async (homeTeam: string, awayTeam: string) => {
    /*
        getEPLMatchPrediction:
        This method calls the EPL prediction API to get win/draw/loss probabilities
        
        params:
            homeTeam: string - home team name (e.g., "Arsenal")
            awayTeam: string - away team name (e.g., "Liverpool")
        returns:
            Object with win, draw, loss probabilities
    */
    
    try {
        await checkBackendHealth();
        const response = await makeBackendRequest('GET', ROUTES.epl_predict(homeTeam, awayTeam, 5));
        
        // The EPL model returns rates/probabilities for win, draw, loss
        // Expected format: { home_win: 0.45, draw: 0.30, away_win: 0.25 }
        return {
            homeWin: response.home_win || 0.33,
            draw: response.draw || 0.33,
            awayWin: response.away_win || 0.33
        };
    } catch (error) {
        console.error(`Error getting EPL prediction for ${homeTeam} vs ${awayTeam}:`, error);
        // Return balanced probabilities as fallback
        return {
            homeWin: 0.40,
            draw: 0.30,
            awayWin: 0.30
        };
    }
};