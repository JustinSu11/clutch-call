/*
    File: frontend/src/utils/nfl_parser.tsx
    Created: 09/30/2025 by CJ Quintero
    Last Updated: 10/08/2025 by CJ Quintero

    Description: This file contains methods 
    to parse each response from the nfl backend methods provided
    in frontend/src/backend_methods/nfl_methods.tsx

    NOTE:: The response is already validated and parsed into 
    an object by the backend method. We just need to call the backend method here
    without the extra validation step.
*/
import { ClassDictionary } from 'clsx';
import * as nfl_methods from '../backend_methods/nfl_methods';
import * as sports_stats_methods from '../backend_methods/sports_stats_methods';
import { HistoricalGameFilters } from '../backend_methods/sports_stats_methods';
import { UpcomingGame, HistoricalGame } from './data_class';


export const parseUpcomingNFLGames = async () => {
    /*
        parseUpcomingNFLGames:
        This method gets the upcoming NFL games from the backend method
        and parses the response to return the upcoming games.

        returns:
            games: an array where each subscript has its own homeTeam and awayTeam

    */

    // await the response from the backend method
    const responseData = await nfl_methods.getUpcomingNFLGames();

    // parse major header
    const events = responseData["events"];

    // map through each event to extract home and away team names
    // into the games array
    // DO NOT DELETE THE COMMAND TO DISABLE THE ANY TYPE
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const games: UpcomingGame[] = events.map((event: any)  => {

        // extract home and away team names
        const homeTeam = event['competitions'][0]['competitors'][0]['team']['displayName'];
        const awayTeam = event['competitions'][0]['competitors'][1]['team']['displayName'];
        const gameDate = event['date'].split('T')[0]; // extract date only, ignore time

        // the official game name for reference
        const officialGameName = event['name'];

        // sanity check to ensure the extracted team names match the official game name
        // ex) "awayTeam at homeTeam" such as "Dallas Cowboys at New York Jets"
        if (`${awayTeam} at ${homeTeam}` !== officialGameName) {
            console.warn(`${awayTeam} at ${homeTeam} does not equal the official game name. officialGameName = ${officialGameName}`);
        }

        return { homeTeam, awayTeam, gameDate };
    });

    return games;
};

export const parseNFLTeamStats = async (teamName: string) => {
    /*
        parseNFLTeamStats:
        This method gets a team's current season stats from the backend method
        and parses the response to return the team's stats.

        params:
            teamName: String - the name of the team to get the stats for. 
                      Must use full display name such as "Dallas Cowboys" not "Cowboys"

        returns:
            teamStats: an array where each subscript has its own team name and stats
    */

    // makes the local date in YYYY-MM-DD using the local timezone
    const todaysDateLocal = (() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    })();

    const seasonStartDate = '2025-09-04'; // NFL season started on Sep 4, 2025

    // await the response from the backend method
    const responseData = await sports_stats_methods.getHistoricalNFLTeamByName(teamName, {
        startDate: `${seasonStartDate}`,              
        endDate: `${todaysDateLocal}`,             
    });

    // parse major header
    const events = responseData['data']['events'];

    // vars to hold the stats
    let totalGames = 0;
    let wins = 0;
    let losses = 0;
    let ties = 0;


    // for each event, get the game info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    events.forEach((event: any) => {

        // home team stuff is always ['competitions'][0]['competitors'][0]
        // away team stuff is always ['competitions'][0]['competitors'][1]
        const homeTeam = event['competitions'][0]['competitors'][0]['team']['displayName'];
        const awayTeam = event['competitions'][0]['competitors'][1]['team']['displayName'];

        const homeScore = parseInt(event['competitions'][0]['competitors'][0]['score']);
        const awayScore = parseInt(event['competitions'][0]['competitors'][1]['score']);

        // determine if the requested team is home or away for this specific game
        if (homeTeam === teamName) {

            // if the home team (the requested team) won
            if (homeScore > awayScore) { wins++;}
            else if (homeScore < awayScore) { losses++; }
            else { ties++; } // tie game
        }
        else {
            // if the away team (the requested team) won
            if (awayScore > homeScore) { wins++; }
            else if (awayScore < homeScore) { losses++; }
            else { ties++; } // tie game
        }

        totalGames++;
    });

    return { wins, losses, ties, totalGames};
};

