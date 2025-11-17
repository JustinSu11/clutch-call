/*
    File: frontend/src/utils/nba_parser.tsx
    Created: 09/30/2025 by CJ Quintero
    Last Updated: 10/13/2025 by Justin Nguyen

    Description: This file contains methods 
    to parse each response from the nba backend methods provided
    in frontend/src/backend_methods/nba_methods.tsx

    NOTE:: The response is already validated and parsed into 
    an object by the backend method. We just need to call the backend method here
    without the extra validation step.
*/
import * as nba_methods from '../backend_methods/nba_methods';
import { UpcomingGame } from './data_class';
import * as sports_stats_methods from '../backend_methods/sports_stats_methods';

// global
const seasonStartDate = '2025-10-21'; // NBA season started on Oct 21, 2025
import formatDate from './date-formatter-for-matches';

// THIS METHOD CURRENTLY DOES NOT WORK 
// due to missing nba api data, I do not know the response json structure yet
// to be able to parse it properly
// until then, the code is copy pasted from the nfl and mls parsers
export const parseUpcomingNBAGames = async () => {
    /*
        parseUpcomingNBAGames:
        This method gets the upcoming NBA games from the backend method
        and parses the response to return the upcoming games.

        returns:
            games: an array where each subscript has its own homeTeam and awayTeam

    */

    // await the response from the backend method
    const responseData = await nba_methods.getUpcomingNBAGames();

    // parse major header
    const events = responseData["events"];
    
    // Check if events exists and is an array
    if (!events || !Array.isArray(events)) {
        console.warn('NBA parser: No events found in response or events is not an array:', responseData);
        return []; // Return empty array if no events
    }

    // declare the Game type
    // each game will have a home team and an away team
    type Game = {
        homeTeam: string;
        awayTeam: string;
        date: Date;
        league: string;
    };

    // map through each event to extract home and away team names
    // into the games array
    // DO NOT DELETE THE COMMAND TO DISABLE THE ANY TYPE
    // IF YOU DO, YOUR COMPUTER WILL EXPLODE
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const games: UpcomingGame[] = events.map((event: any)  => {

        // extract home and away team names
        const homeTeam = event['competitions'][0]['competitors'][0]['team']['displayName'];
        const awayTeam = event['competitions'][0]['competitors'][1]['team']['displayName'];
        const gameDate = event['date'].split('T')[0]; // extract date only, ignore time
        
        // extract game ID
        const gameId = event['id'];

        // the official game name for reference
        const officialGameName = event['name'];

        // extract date of match
        const date = event['date']

        //categorize into a league
        const league = "NBA"

        // sanity check to ensure the extracted team names match the official game name
        // ex) "awayTeam at homeTeam" such as "Dallas Cowboys at New York Jets"
        if (`${awayTeam} at ${homeTeam}` !== officialGameName) {
            console.warn(`${awayTeam} at ${homeTeam} does not equal the official game name. officialGameName = ${officialGameName}`);
        }

        // change gameDate to MM-DD-YYY format
        const month = gameDate.split('-')[1];
        const day = gameDate.split('-')[2];
        const year = gameDate.split('-')[0];
        const formattedGameDate = `${month}-${day}-${year}`;

        // return { homeTeam, awayTeam, gameDate: formattedGameDate };
        return { homeTeam, awayTeam, gameDate: new Date(gameDate), dateAndTime: new Date(date), league, gameId };
    });

    return games;
};


export const parseNBATeamStats = async (teamName: string) => {
    /*
        parseNBATeamStats:
        This method gets a team's current season stats from the backend method
        and parses the response to return the team's stats.

        params:
            teamName: String - the name of the team to get the stats for. 
                      Must use full display name 

        returns:
            stats: dict - an object with wins, losses, ties, totalGames
    */

    // makes the local date in YYYY-MM-DD using the local timezone
    const todaysDateLocal = (() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    })();

    try {
        // await the response from the backend method
        const responseData = await sports_stats_methods.getHistoricalNBATeamByName(teamName, {
            startDate: `${seasonStartDate}`,              
            endDate: `${todaysDateLocal}`,             
        });

        console.log('NBA Team Stats Response for', teamName, ':', responseData);

        // Check if we have data - NBA API structure is different from NFL
        if (!responseData || !responseData.data || !responseData.data.data) {
            console.warn('No NBA team data available for', teamName);
            return { wins: 0, losses: 0, ties: 0, totalGames: 0 };
        }

        // NBA API returns games in data.data array
        const games = responseData.data.data;

        // vars to hold the stats
    let totalGames = 0;
    let wins = 0;
    let losses = 0;
    const ties = 0;

        // for each game, check the W/L status
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        games.forEach((game: any) => {
            // get the game date and compare to current date
            const gameDate = new Date(game.game_date);

            // this prevents upcoming games from being counted
            // by ensuring we only count games that have already passed
            if (gameDate.getTime() >= Date.now()) {
                return;
            }

            // NBA API provides direct W/L in the 'wl' field
            const result = game.wl;
            
            if (result === 'W') {
                wins++;
            } else if (result === 'L') {
                losses++;
            }
            // NBA doesn't have ties, but keeping the variable for consistency
            
            totalGames++;
        });

        console.log('NBA Stats parsed:', { wins, losses, ties, totalGames });
        return { wins, losses, ties, totalGames};
        
    } catch (error) {
        console.error('Error fetching NBA team stats for', teamName, ':', error);
        return { wins: 0, losses: 0, ties: 0, totalGames: 0 };
    }
};