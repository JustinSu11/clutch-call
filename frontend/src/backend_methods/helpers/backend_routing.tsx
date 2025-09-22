const BASE_URL = "http://127.0.0.1:8000/api/v1";

const ROUTES = {
    health: `${BASE_URL}/health`,
    nba_games: `${BASE_URL}/nba/games`,
    specific_nba_game_details: (gameId: string) => `${BASE_URL}/nba/game/${gameId}`,
    specific_nba_game_boxscore: (gameId: string) => `${BASE_URL}/nba/game/${gameId}/boxscore`,
    specific_nba_team_last_game: (teamId: string) => `${BASE_URL}/nba/teams/${teamId}/last`,
    upcoming_nba_games: `${BASE_URL}/nba/upcoming`,
    nfl_games: `${BASE_URL}/nfl/games`,
    specific_nfl_game_details: (gameId: string) => `${BASE_URL}/nfl/game/${gameId}`,
    specific_nfl_game_boxscore: (gameId: string) => `${BASE_URL}/nfl/game/${gameId}/boxscore`,
    upcoming_nfl_games: `${BASE_URL}/nfl/upcoming`,
    soccer_matches: `${BASE_URL}/soccer/matches`,
    specific_soccer_match_details: (matchId: string) => `${BASE_URL}/soccer/game/${matchId}`,
    specific_soccer_match_boxscore: (matchId: string) => `${BASE_URL}/soccer/game/${matchId}/boxscore`,
    upcoming_soccer_matches: `${BASE_URL}/soccer/upcoming`,
};


function getRequest(url: string)
{
    try{
        return fetch(url).then(response => response.json());
    }
    catch(error){
        console.error("Error fetching data:", error);
        throw error;
    }
}

function postRequest(url: string, data: any)
{
    try{
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }).then(response => response.json());
    }
    catch(error){
        console.error("Error posting data:", error);
        throw error;
    }
}
