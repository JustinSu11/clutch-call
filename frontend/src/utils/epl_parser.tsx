/*
    File: frontend/src/utils/epl_parser.tsx
    Created: 11/08/2025 by Claude Code
    Description: This file contains methods to parse EPL match data
    from the EPL prediction model backend endpoints.
*/

import { getEPLUpcomingMatches } from '../backend_methods/soccer_methods';
import { UpcomingGame, Team } from './data_class';

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
        const games: UpcomingGame[] = matches.map((match: any) => {
            
            // Create team objects for EPL teams
            const homeTeam: Team = {
                abbreviation: match.home_team.substring(0, 3).toUpperCase(), // Use first 3 letters as abbreviation
                color: '#003399', // Default EPL blue
                alternateColor: '#ffffff', // Default white
                displayName: match.home_team,
            };
            
            const awayTeam: Team = {
                abbreviation: match.away_team.substring(0, 3).toUpperCase(), // Use first 3 letters as abbreviation
                color: '#ff0000', // Default EPL red
                alternateColor: '#ffffff', // Default white
                displayName: match.away_team,
            };

            // Parse the date from ISO format
            const gameDate = new Date(match.date);
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
                dateAndTime: match.date,
                league: league
            };
        });

        return games;

    } catch (error) {
        console.error('Error parsing EPL games:', error);
        return []; // Return empty array if there's an error
    }
};