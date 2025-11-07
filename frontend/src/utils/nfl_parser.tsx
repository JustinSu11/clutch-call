/*
    File: frontend/src/utils/nfl_parser.tsx
    Created: 09/30/2025 by CJ Quintero
    Last Updated: 10/13/2025 by Justin Nguyen

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

// globals
const seasonStartDate = '2025-09-04'; // NFL season started on Sep 4, 2025

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
        const gameDate = event.date?.split('T')[0] || ''; // Extract date only, ignore time
        let date = '';
        if (gameDate) {
            const [year, month, day] = gameDate.split('-');
            date = `${month}-${day}-${year}`; // MM-DD-YYYY format
        }

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

     // Use unified, robust parsing logic for upcoming NFL games
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

export const parseNFLTeamStats = async (teamName: string) => {
    /*
        parseNFLTeamStats:
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
        
        // get the eventDate and compare to current date
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
            if (homeScore > awayScore) { wins++; }
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

    return { wins, losses, ties, totalGames };
};
export const parseNFLTeamLogo = async (teamName: string) => {
    /*
        parseNFLTeamLogo:
        This method gets a team's logo and returns the url

        params:
            teamName: String - the name of the team to get the logo for.

        returns:
            logoUrl: String - the url of the team's logo
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

    // for the logo url, we just have to check 1 game
    const gameData = responseData['data']['events'][0];

    // the team logo we want varies if the team is home or away
    // so we have to check both teams for a matching name
    const team0 = gameData['competitions'][0]['competitors'][0]['team']['displayName'];
    const team1 = gameData['competitions'][0]['competitors'][1]['team']['displayName'];

    // check the first team, then the second for a name match. Else, log the error
    if (team0 === teamName) {
        return gameData['competitions'][0]['competitors'][0]['team']['logo'];
    } 
    else if (team1 === teamName) {
        return gameData['competitions'][0]['competitors'][1]['team']['logo'];
    }
    else {
        console.log(`[ERROR]::Logo for team: ${teamName} could not be found.`);
        return '';
    }
};
