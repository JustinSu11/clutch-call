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
        const date = event['competitions']['date']

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
        return { homeTeam, awayTeam, gameDate: formattedGameDate, date, league: league };
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
    const responseData = await sports_stats_methods.getHistoricalSoccerTeamByName(teamName, {
        startDate: `${seasonStartDate}`,              
        endDate: `${todaysDateLocal}`,             
    });

    console.log(`Team name: ${teamName}`);
    console.log(responseData);

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

