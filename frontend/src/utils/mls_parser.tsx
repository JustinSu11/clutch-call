/*
    File: frontend/src/utils/mls_parser.tsx
    Created: 09/30/2025 by CJ Quintero
    Last Updated: 10/22/2025 by CJ Quintero

    Description: This file contains methods 
    to parse each response from the mls backend methods provided
    in frontend/src/backend_methods/soccer_methods.tsx

    NOTE:: The response is already validated and parsed into 
    an object by the backend method. We just need to call the backend method here
    without the extra validation step.
*/
import * as mls_methods from '../backend_methods/soccer_methods';
import formatDate from './date-formatter-for-matches';
import { UpcomingGame, Team } from './data_class';
import * as sports_stats_methods from '../backend_methods/sports_stats_methods';
import * as standings_methods from '../backend_methods/standings_methods';

// global
const seasonStartDate = '2025-02-22'; // MLS season started on Feb 22, 2025


export const parseUpcomingMLSGames = async () => {
    /*
        parseUpcomingMLSGames:
        This method gets the upcoming MLS games from the backend method
        and parses the response to return the upcoming games.

        returns:
            games: an array where each subscript has its own homeTeam and awayTeam

    */

    // await the response from the backend method
    const responseData = await mls_methods.getUpcomingSoccerMatches();

    // parse major header
    const events = responseData["events"];

    // declare the Game type
    // each game will have a home team and an away team
    type Game = {
        homeTeam: string;
        awayTeam: string;
        date: Date;
        league: string;
    };

    // map through each event to extract home and away team names
    // into the games array. 
    // DO NOT DELETE THE COMMAND TO DISABLE THE ANY TYPE
    // IF YOU DO, YOUR COMPUTER WILL EXPLODE
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const games: UpcomingGame[] = events.map((event: any)  => {

        // extract home and away team names
        const homeTeam:Team = {
            abbreviation: event['competitions'][0]['competitors'][0]['team']['abbreviation'],
            color: event['competitions'][0]['competitors'][0]['team']['color'],
            alternateColor: event['competitions'][0]['competitors'][0]['team']['alternateColor'],
            displayName: event['competitions'][0]['competitors'][0]['team']['displayName'],
        };
        const awayTeam:Team = {
            abbreviation: event['competitions'][0]['competitors'][1]['team']['abbreviation'],
            color: event['competitions'][0]['competitors'][1]['team']['color'],
            alternateColor: event['competitions'][0]['competitors'][1]['team']['alternateColor'],
            displayName: event['competitions'][0]['competitors'][1]['team']['displayName'],
        }
        const gameDate = event['date'].split('T')[0]; // extract date only, ignore time

        // the official game name for reference
        const officialGameName = event['name'];

        // extract date of match
        const dateAndTime = event['date']

        //categorize into a league
        const league = "MLS"

        // sanity check to ensure the extracted team names match the official game name
        // ex) "awayTeam at homeTeam" such as "Dallas Cowboys at New York Jets"
        if (`${awayTeam} at ${homeTeam}` !== officialGameName) {
            console.warn(`${awayTeam} at ${homeTeam} does not equal the official game name. officialGameName = ${officialGameName}`);
        }

        const month = gameDate.split('-')[1];
        const day = gameDate.split('-')[2];
        const year = gameDate.split('-')[0];
        const formattedGameDate = `${month}-${day}-${year}`;

        // return { homeTeam, awayTeam, gameDate: formattedGameDate };
        return { homeTeam, awayTeam, gameDate: formattedGameDate, dateAndTime: dateAndTime, league: league };
    });

    return games;
};


export const parseMLSTeamStats = async (teamName: string) => {
    /*
        parseMLSTeamStats:
        This method gets a team's current season stats from the backend method
        and parses the response to return the team's stats.

        params:
            teamName: String - the name of the team to get the stats for. 
                      Must use full display name 

        returns:
            stats: dict - an object with wins, losses, draws, totalGames
    */

    // makes the local date in YYYY-MM-DD using the local timezone
    const todaysDateLocal = (() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    })();

    // await the response from the backend method
    const responseData = await standings_methods.getSoccerStandings("2025");

    console.log(responseData);

    // parse major header
    const standings = responseData["standings"];

    // vars to hold the stats
    let totalGames = 0;
    let wins = 0;
    let losses = 0;
    let ties = 0;
    let found = false;

    // loop through each team's data to find the matching team
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    standings.forEach((standing: any) => {

        const currentTeamName = standing["team_name"];

        // if found get the stats
        if (currentTeamName === teamName)
        {
            
            // if team found, extract stats and break loop
            totalGames = standing["games_played"];
            wins = standing["wins"];
            losses = standing["losses"];
            ties = standing["draws"];
            found = true;
        }

    });

    // if found return the stats
    if(found)
    {
        return { wins, losses, ties, totalGames };
    }

    // if not found, log and return empty stats
    console.log(`Team data for ${teamName} not found.`);
    return { wins: 0, losses: 0, ties: 0, totalGames: 0}
}; // end parseMLSTeamStats

export const parseMLSPreviousGameStats = async (teamName: string) => {
    /*
        parseMLSPreviousGameStats:
        This method gets a team's score from their previous games this season

        
        NOTE::
        This method doesn't work due to the api response limitations.
    */

    // makes the local date in YYYY-MM-DD using the local timezone
    const todaysDateLocal = (() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    })();

    // await the response from the backend method
    const responseData = await sports_stats_methods.getHistoricalSoccerTeamByName(teamName, 
        {
            startDate: seasonStartDate,
            endDate: todaysDateLocal
        }
    );

    console.log(responseData);

    // parse major header
    const events = responseData['data']['events'];

    // Filter out upcoming games - use a buffer of a few hours to account for games in progress
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pastEvents = events.filter((event: any) => {
        const eventDate = new Date(event['date']);
        const now = Date.now();
        // Add 3 hour buffer (soccer games typically last 2 hours)
        const bufferTime = 3 * 60 * 60 * 1000; 
        
        // Log for debugging
        console.log(`Event date: ${event['date']}, Now: ${new Date(now).toISOString()}, Is past: ${eventDate.getTime() + bufferTime < now}`);
        
        return eventDate.getTime() + bufferTime < now;
    });

    console.log(`Past events for ${teamName}:`, pastEvents.length);

    // array to hold the parsed previous game stats (initialize empty array)
    const gameStats: number[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pastEvents.forEach((event: any) => {
        
        // home team stuff is always ['competitions'][0]['competitors'][0]
        // away team stuff is always ['competitions'][0]['competitors'][1]
        const homeTeam = event['competitions'][0]['competitors'][0]['team']['displayName'];
        const awayTeam = event['competitions'][0]['competitors'][1]['team']['displayName'];

        const homeScore = parseInt(event['competitions'][0]['competitors'][0]['score']);
        const awayScore = parseInt(event['competitions'][0]['competitors'][1]['score']);

        // determine if the requested team is home or away for this specific game
        if (homeTeam === teamName) {
            gameStats.push(homeScore);
        }
        else if (awayTeam === teamName) {
            gameStats.push(awayScore);
        }
    });

    console.log(`Game stats for ${teamName}:`, gameStats);

    return gameStats;
}

