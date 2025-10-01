/*
    File: frontend/src/utils/nfl_parser.tsx
    Created: 09/30/2025 by CJ Quintero
    Last Updated: 09/29/2025 by CJ Quintero

    Description: This file contains methods 
    to parse each response from the nfl backend methods provied
    in frontend/src/backend_methods/nfl_methods.tsx

    NOTE:: The response is already validated and parsed into 
    an object by the backend method. We just need to call the backend method here
    without the extra validation step.
*/
import * as nfl_methods from '../backend_methods/nfl_methods';
import * as soccer_methods from '../backend_methods/soccer_methods';
import * as nba_methods from '../backend_methods/nba_methods';


export const parseUpcomingNFLGames = async () => {
    /*
        parseUpcomingNFLGames:
        This method gets the upcoming NFL games from the backend method
        and parses the response to return the upcoming games.

        example response:
        {
            "events": [
                { ... }
            ],
            "leagues": [
             { ... }
            ]
        }
    */


    // await the response from the backend method
    const responseData = await nfl_methods.getUpcomingNFLGames();

    // parse major headers
    const events = responseData["events"]
    const leagues = responseData["leagues"]

    // for each event in the events array, extract the 2 teams playing
    for (const event of events) {

        // extract the home and away teams
        const homeTeam = event['competitions'][0]['competitors'][0]['team']['displayName'];
        const awayTeam = event['competitions'][0]['competitors'][1]['team']['displayName'];

        // extract the official game name for reference
        const gameName = event['name']

        // a validation check to ensure that the home team and away team match the official game name
        if (`${awayTeam} at ${homeTeam}` === gameName) {
            console.log(`Parsed NFL Game: ${awayTeam} at ${homeTeam}`);
        } 
        else {
            console.warn(`Team names do not match official game name: ${gameName} != ${awayTeam} at ${homeTeam}`);
        }

    }


};
