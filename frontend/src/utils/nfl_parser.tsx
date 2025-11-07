/*
    File: frontend/src/utils/nfl_parser.tsx
    Created: 09/30/2025 by CJ Quintero
<<<<<<< HEAD
    Last Updated: 11/06/2025 by CJ Quintero
=======
    Last Updated: 10/13/2025 by Justin Nguyen
>>>>>>> e61d0a3ad994c2da72dd576eb411a6492fdfa85d

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
import { UpcomingGame, Team } from './data_class';
import formatDate from './date-formatter-for-matches';

// globals
const seasonStartDate = '2025-09-04'; // NFL season started on Sep 4, 2025

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

        // extract date of match
        const gameDate = event['date'].split('T')[0]; // extract date only, ignore time
        const dateAndTime = event['date']

        // the official game name for reference
        const officialGameName = event['name'];

        //categorize into a league
        const league = "NFL"

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

        // return { homeTeam, awayTeam, gameDate: formattedGameDate};
        return { homeTeam, awayTeam, gameDate: formattedGameDate, dateAndTime: dateAndTime, league: league };
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
        
        // get the eventDate and compare to current dat
        const iso = event['date'];
        const eventDate = new Date(iso);

        // this prevents upcoming games from being counted
        // by ensuring we only count games that have already passed
        if(eventDate.getTime() >= Date.now()) {
            return;
        }

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
            else if (homeScore === awayScore) { ties++; } // tie game
        }
        else if (awayTeam === teamName) {
            // if the away team (the requested team) won
            if (awayScore > homeScore) { wins++; }
            else if (awayScore < homeScore) { losses++; }
            else if (awayScore === homeScore) { ties++; } // tie game
        }

        totalGames++;
    });

    return { wins, losses, ties, totalGames};
};

export const parseNFLPreviousGameStats = async (teamName: string) => {
    /*
        parseNFLPreviousGameStats:
        This method gets a team's score from their previous games this season
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
    const responseData = await sports_stats_methods.getHistoricalNFLTeamByName(teamName, {
        startDate: `${seasonStartDate}`,              
        endDate: `${todaysDateLocal}`,             
    });

    // parse major header
    const events = responseData['data']['events'];

    // Filter out upcoming games first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pastEvents = events.filter((event: any) => {
        const eventDate = new Date(event['date']);
        return eventDate.getTime() < Date.now();
    });


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

    return gameStats;
}

    

