/*
    File: frontend/src/utils/nba_parser.tsx
    Created: 09/30/2025 by CJ Quintero
    Last Updated: 09/30/2025 by CJ Quintero

    Description: This file contains methods 
    to parse each response from the nba backend methods provided
    in frontend/src/backend_methods/nba_methods.tsx

    NOTE:: The response is already validated and parsed into 
    an object by the backend method. We just need to call the backend method here
    without the extra validation step.
*/
import * as nba_methods from '../backend_methods/nba_methods';

// THIS METHOD CURRENT DOES NOT WORK 
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
    const events = responseData["events"]

    // declare the Game type
    // each game will have a home team and an away team
    type Game = {
    homeTeam: string;
    awayTeam: string;
    };

    // map through each event to extract home and away team names
    // into the games array
    const games: Game[] = events.map((event: any)  => {

        // extract home and away team names
        const homeTeam = event['competitions'][0]['competitors'][0]['team']['displayName'];
        const awayTeam = event['competitions'][0]['competitors'][1]['team']['displayName'];

        // the official game name for reference
        const officialGameName = event['name'];

        // sanity check to ensure the extracted team names match the official game name
        // ex) "awayTeam at homeTeam" such as "Dallas Cowboys at New York Jets"
        if (`${awayTeam} at ${homeTeam}` !== officialGameName) {
            console.warn(`${awayTeam} at ${homeTeam} does not equal the official game name. officialGameName = ${officialGameName}`);
        }

        return { homeTeam, awayTeam };
    });

    return games;
};
