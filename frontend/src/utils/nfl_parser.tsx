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

// Game type definition
type Game = {
    id: string; // The ESPN event ID
    homeTeam: string;
    awayTeam: string;
    date: string; // Formatted date string from formatDate
    status?: {
        state?: string; // e.g., "pre", "in", "post"
        type?: string;  // e.g., "STATUS_SCHEDULED", "STATUS_IN_PROGRESS", "STATUS_FINAL"
    };
};

// Helper function to parse events from any NFL games response
export const parseNFLGamesFromEvents = (events: any[]): Game[] => {
    return events.map((event: any): Game | null => {
        // Extract the event ID
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

        // Extract status information - check multiple possible locations
        const status = event.status || {};
        const statusType = status.type || {};
        
        // ESPN API structure: event.status.type.name and event.status.type.state
        // Also check competition status if available (competition already declared above)
        const compStatus = competition?.status || {};
        const compStatusType = compStatus.type || {};
        
        const gameStatus = {
            state: (statusType.state || compStatusType.state || status.state || compStatus.state || 'unknown').toString().toLowerCase(),
            type: (statusType.name || compStatusType.name || status.name || compStatus.name || 'unknown').toString().toLowerCase()
        };

        // Debug logging for status (always log in development)
        console.log(`🎮 Game ${eventId} (${awayTeam} @ ${homeTeam}):`, {
            eventStatus: event.status,
            compStatus: competition?.status,
            parsedState: gameStatus.state,
            parsedType: gameStatus.type,
            fullEvent: event // Log full event for debugging
        });

        return { id: eventId, homeTeam, awayTeam, date, status: gameStatus };

    }).filter((game): game is Game => game !== null); // Filter out any null entries caused by errors
};

export const parseUpcomingNFLGames = async () => {
    /*
        parseUpcomingNFLGames:
        This method gets the upcoming NFL games from the backend method
        and parses the response to return the upcoming games.

        returns:
            games: an array where each object has id, homeTeam, awayTeam, date, and status
    */
    // await the response from the backend method
    const responseData = await nfl_methods.getUpcomingNFLGames();
    
    console.log('📥 Raw response from getUpcomingNFLGames:', responseData);

    // Check if events array exists and is not empty
    if (!responseData || !responseData.events || responseData.events.length === 0) {
        console.warn("⚠️ No upcoming NFL games found in the response.", responseData);
        return []; // Return empty array if no events
    }

    // parse major header
    const events = responseData["events"];
    console.log(`📋 Found ${events.length} events in upcoming games response`);

    return parseNFLGamesFromEvents(events);
};

export const parseTodayNFLGames = async () => {
    /*
        parseTodayNFLGames:
        This method gets today's NFL games from the backend method
        and parses the response to return the games (including in-progress and completed games).

        returns:
            games: an array where each object has id, homeTeam, awayTeam, date, and status
    */
    try {
        const responseData = await nfl_methods.getTodayNFLGames();
        
        console.log('📥 Raw response from getTodayNFLGames:', responseData);

        // Check if events array exists and is not empty
        if (!responseData || !responseData.events || responseData.events.length === 0) {
            console.warn("⚠️ No today's NFL games found in the response.", responseData);
            return []; // Return empty array if no events
        }

        const events = responseData["events"];
        console.log(`📋 Found ${events.length} events in today's games response`);
        
        return parseNFLGamesFromEvents(events);
    } catch (error) {
        console.error("❌ Error parsing today's NFL games:", error);
        return []; // Return empty array on error
    }
};