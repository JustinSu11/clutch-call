/* eslint-disable @typescript-eslint/no-explicit-any */
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
import * as nfl_methods from '../backend_methods/nfl_methods';
import * as sports_stats_methods from '../backend_methods/sports_stats_methods';
import { UpcomingGame, Team } from './data_class';
import formatDate from './date-formatter-for-matches';

// globals
const seasonStartDate = '2025-09-04'; // NFL season started on Sep 4, 2025

// Game type definition - extended to include PR#63 properties
type Game = {
    id: string; // The ESPN event ID
    homeTeam: string;
    awayTeam: string;
    date: string; // Formatted date string (MM-DD-YYYY)
    gameDate?: string; // Formatted date string (MM-DD-YYYY) - PR#63 property
    dateAndTime?: string; // Raw date from event - PR#63 property
    homeTeamLogo?: string; // Team logo URL
    awayTeamLogo?: string; // Team logo URL
    league?: string; // PR#63 property
    gameId?: string; // PR#63 property (alias for id)
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
             return null;
        }

        const competition = event.competitions?.[0];
        const competitors = competition?.competitors;
        if (!competitors || competitors.length < 2) {
            console.warn("Event is missing competitor data:", event);
            return null;
        }
        
        // Use find to be safer about home/away order
        const homeTeamData = competitors.find((c: any) => c.homeAway === 'home');
        const awayTeamData = competitors.find((c: any) => c.homeAway === 'away');

        if (!homeTeamData || !awayTeamData) {
             console.warn("Could not find both home and away team data:", event);
             return null;
        }
        
        const homeTeam = homeTeamData.team?.displayName || 'TBD';
        const awayTeam = awayTeamData.team?.displayName || 'TBD';
        
        // Extract date of match - PR#63 pattern
        const gameDate = event.date?.split('T')[0] || ''; // Extract date only, ignore time
        const dateAndTime = event.date || ''; // Raw date from event
        
        // Format date to MM-DD-YYYY (PR#63 pattern)
        let formattedDate = '';
        let formattedGameDate = '';
        if (gameDate) {
            const [year, month, day] = gameDate.split('-');
            formattedDate = `${month}-${day}-${year}`; // MM-DD-YYYY format
            formattedGameDate = formattedDate; // Same format for gameDate
        }

        // Extract status information
        const status = event.status || {};
        const statusType = status.type || {};
        const compStatus = competition?.status || {};
        const compStatusType = compStatus.type || {};
        
        const gameStatus = {
            state: (statusType.state || compStatusType.state || status.state || compStatus.state || 'unknown').toString().toLowerCase(),
            type: (statusType.name || compStatusType.name || status.name || compStatus.name || 'unknown').toString().toLowerCase()
        };

        // The official game name for reference (PR#63 pattern)
        const officialGameName = event.name || '';
        
        // Sanity check to ensure the extracted team names match the official game name (PR#63 pattern)
        if (officialGameName && `${awayTeam} at ${homeTeam}` !== officialGameName) {
            console.warn(`${awayTeam} at ${homeTeam} does not equal the official game name. officialGameName = ${officialGameName}`);
        }

        return { 
            id: eventId, 
            homeTeam, 
            awayTeam, 
            date: formattedDate,
            gameDate: formattedGameDate, // PR#63 property
            dateAndTime: dateAndTime, // PR#63 property
            homeTeamLogo: homeTeamData.team?.logo || '',
            awayTeamLogo: awayTeamData.team?.logo || '',
            league: "NFL", // PR#63 property
            gameId: eventId, // PR#63 property (alias for id)
            status: gameStatus 
        };

    }).filter((game): game is Game => game !== null);
};

export const parseUpcomingNFLGames = async (): Promise<UpcomingGame[]> => {
    /*
        parseUpcomingNFLGames:
        This method gets the upcoming NFL games from the backend method
        and parses the response to return the upcoming games.

        returns:
            games: an array where each object has homeTeam, awayTeam (as Team objects), gameDate, dateAndTime, and league
    */
    // await the response from the backend method
    const responseData = await nfl_methods.getUpcomingNFLGames();
    
    console.log('Raw response from getUpcomingNFLGames:', responseData);

    // Check if events array exists and is not empty
    if (!responseData || !responseData.events || responseData.events.length === 0) {
        console.warn("No upcoming NFL games found in the response.", responseData);
        return []; // Return empty array if no events
    }

    // parse major header
    const events = responseData["events"];
    console.log(`Found ${events.length} events in upcoming games response`);

    // Map events to UpcomingGame format with Team objects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const games: UpcomingGame[] = events.map((event: any): UpcomingGame | null => {
        const competition = event.competitions?.[0];
        const competitors = competition?.competitors;
        if (!competitors || competitors.length < 2) {
            console.warn("Event is missing competitor data:", event);
            return null;
        }
        
        // Use find to be safer about home/away order
        const homeTeamData = competitors.find((c: any) => c.homeAway === 'home');
        const awayTeamData = competitors.find((c: any) => c.homeAway === 'away');

        if (!homeTeamData || !awayTeamData) {
            console.warn("Could not find both home and away team data:", event);
            return null;
        }

        // Extract team data as Team objects
        const homeTeam: Team = {
            abbreviation: homeTeamData.team?.abbreviation || '',
            color: homeTeamData.team?.color || '000000',
            alternateColor: homeTeamData.team?.alternateColor || 'FFFFFF',
            displayName: homeTeamData.team?.displayName || 'TBD',
        };
        
        const awayTeam: Team = {
            abbreviation: awayTeamData.team?.abbreviation || '',
            color: awayTeamData.team?.color || '000000',
            alternateColor: awayTeamData.team?.alternateColor || 'FFFFFF',
            displayName: awayTeamData.team?.displayName || 'TBD',
        };

        // Extract date of match
        const dateAndTime = event.date || '';
        const gameDate = dateAndTime ? new Date(dateAndTime) : new Date();
        
        // Format date to MM-DD-YYYY for display
        let formattedGameDate = '';
        if (dateAndTime) {
            const dateObj = new Date(dateAndTime);
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const year = dateObj.getFullYear();
            formattedGameDate = `${month}-${day}-${year}`;
        }

        return {
            homeTeam,
            awayTeam,
            gameDate: gameDate,
            dateAndTime: dateAndTime ? new Date(dateAndTime) : new Date(),
            league: "NFL",
            gameId: event.id // Add the event ID so live game status can match it
        };
    }).filter((game: UpcomingGame | null): game is UpcomingGame => game !== null);

    return games;
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

        console.log('Raw response from getTodayNFLGames:', responseData);

        // Check if events array exists and is not empty
        if (!responseData || !responseData.events || responseData.events.length === 0) {
            console.warn("No today's NFL games found in the response.", responseData);
            return []; // Return empty array if no events
        }

        const events = responseData["events"];
        console.log(`Found ${events.length} events in today's games response`);

        return parseNFLGamesFromEvents(events);
    } catch (error) {
        console.error("Error parsing today's NFL games:", error);
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

        // Check if data exists and has events
        if (!responseData || !responseData['data'] || !responseData['data']['events']) {
            console.warn(`No events found for team: ${teamName}`);
            return { wins: 0, losses: 0, ties: 0, totalGames: 0 };
        }

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
            if (!iso) {
                return; // Skip if date is missing
            }
            const eventDate = new Date(iso);
            
            // Check if date is valid
            if (isNaN(eventDate.getTime())) {
                return; // Skip if date is invalid
            }

            // this prevents upcoming games from being counted
            // by ensuring we only count games that have already passed
            if(eventDate.getTime() >= Date.now()) {
                return;
            }

            // home team stuff is always ['competitions'][0]['competitors'][0]
            // away team stuff is always ['competitions'][0]['competitors'][1]
            // Add safety checks
            if (!event['competitions'] || !event['competitions'][0] || !event['competitions'][0]['competitors'] || event['competitions'][0]['competitors'].length < 2) {
                console.warn(`Invalid event structure, skipping:`, event);
                return;
            }

            const homeTeam = event['competitions'][0]['competitors'][0]['team']?.displayName;
            const awayTeam = event['competitions'][0]['competitors'][1]['team']?.displayName;

            const homeScore = parseInt(event['competitions'][0]['competitors'][0]['score'] || '0');
            const awayScore = parseInt(event['competitions'][0]['competitors'][1]['score'] || '0');

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

    

