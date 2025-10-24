/*
    File: frontend/src/utils/nfl_parser.tsx
    Created: 09/30/2025 by CJ Quintero
    Last Updated: 09/30/2025 by CJ Quintero

    Description: This file contains methods 
    to parse each response from the nfl backend methods provided
    in frontend/src/backend_methods/nfl_methods.tsx

    NOTE:: The response is already validated and parsed into 
    an object by the backend method. We just need to call the backend method here
    without the extra validation step.
*/
import * as nfl_methods from '../backend_methods/nfl_methods';
import formatDate from './date-formatter-for-matches';


export const parseUpcomingNFLGames = async () => {
    /*
        parseUpcomingNFLGames:
        This method gets the upcoming NFL games from the backend method
        and parses the response to return the upcoming games.

        returns:
            games: an array where each object has id, homeTeam, awayTeam, and date
    */

    // await the response from the backend method
    const responseData = await nfl_methods.getUpcomingNFLGames();

    // Check if events array exists and is not empty
    if (!responseData || !responseData.events || responseData.events.length === 0) {
        console.warn("No upcoming NFL games found in the response.");
        return []; // Return empty array if no events
    }

    // parse major header
    const events = responseData["events"];

    // declare the Game type
    // --- UPDATE: Added the 'id' property ---
    type Game = {
        id: string; // The ESPN event ID
        homeTeam: string;
        awayTeam: string;
        date: Date;
    };

    // map through each event to extract home and away team names
    // into the games array
    // DO NOT DELETE THE COMMAND TO DISABLE THE ANY TYPE
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const games: Game[] = events.map((event: any): Game | null => {

        // --- UPDATE: Extract the event ID ---
        const eventId = event.id;
        if (!eventId || typeof eventId !== 'string') {
             console.warn("Event is missing a valid ID:", event);
             return null; // Skip this event if ID is missing or invalid
        }

        const competition = event.competitions?.[0];
        const competitors = competition?.competitors;
        if (!competitors || competitors.length < 2) {
            console.warn("Event is missing competitor data:", event);
            return null; // Skip if competitor data is missing
        }
        
        // Use find to be safer about home/away order
        const homeTeamData = competitors.find((c: any) => c.homeAway === 'home');
        const awayTeamData = competitors.find((c: any) => c.homeAway === 'away');

        if (!homeTeamData || !awayTeamData) {
             console.warn("Could not find both home and away team data:", event);
             return null; // Skip if teams aren't found
        }
        
        const homeTeam = homeTeamData.team?.displayName || 'TBD';
        const awayTeam = awayTeamData.team?.displayName || 'TBD';
        
        // extract date of match
        const date = formatDate(event.date);

        // --- UPDATE: Include the 'id' in the returned object ---
        return { id: eventId, homeTeam, awayTeam, date };

    }).filter((game): game is Game => game !== null); // Filter out any null entries caused by errors

    return games;
};