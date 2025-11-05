/**
 * File: nba_prediction_parser.ts
 * Author: Maaz Haque
 * Description: Utility functions to parse and extract specific data from NBA ML predictions
 */

// ===============================================
// TYPE DEFINITIONS
// ===============================================

export interface DecisionFactor {
    factor: string;
    importance: number;
    value: number;
    contribution: number;
}

export interface GamePrediction {
    game_id: string;
    game_date: string;
    home_team_id: number;
    away_team_id: number;
    predicted_winner: 'home' | 'away';
    confidence: number;
    home_win_probability: number;
    away_win_probability: number;
    decision_factors: DecisionFactor[];
    prediction_timestamp?: string;
}

export interface PlayerPrediction {
    player_id: string;
    player_name: string;
    position: string;
    predicted_points: number;
    predicted_assists: number;
    predicted_rebounds: number;
    decision_factors?: {
        points?: DecisionFactor[];
        assists?: DecisionFactor[];
        rebounds?: DecisionFactor[];
    };
}

export interface GamePlayerPredictions {
    game_id: string;
    game_date: string;
    home_team_predictions: PlayerPrediction[];
    away_team_predictions: PlayerPrediction[];
}

export interface GameDetailPrediction {
    game_id: string;
    game_date: string;
    prediction_timestamp: string;
    game_outcome: {
        home_team_id: number;
        away_team_id: number;
        predicted_winner: 'home' | 'away';
        confidence: number;
        home_win_probability: number;
        away_win_probability: number;
        decision_factors: DecisionFactor[];
    };
    player_predictions: {
        home_team: PlayerPrediction[];
        away_team: PlayerPrediction[];
    };
    summary: {
        total_players: number;
        home_players: number;
        away_players: number;
    };
}

export interface TopPerformer {
    game_id: string;
    game_date: string;
    home_team_id: number;
    away_team_id: number;
    team_type: 'home' | 'away';
    team_id: number;
    player_id: string;
    player_name: string;
    position: string;
    predicted_points: number;
    predicted_assists: number;
    predicted_rebounds: number;
}

// ===============================================
// GAME OUTCOME PARSING FUNCTIONS
// ===============================================

/**
 * Extract winner information from a game prediction
 */
export const getWinnerInfo = (prediction: GamePrediction) => {
    return {
        teamId: prediction.predicted_winner === 'home' ? prediction.home_team_id : prediction.away_team_id,
        teamType: prediction.predicted_winner,
        winProbability: prediction.predicted_winner === 'home' 
            ? prediction.home_win_probability 
            : prediction.away_win_probability,
        confidence: prediction.confidence
    };
};

/**
 * Get confidence level as a descriptive string
 */
export const getConfidenceLevel = (confidence: number): string => {
    if (confidence >= 0.90) return 'Very High';
    if (confidence >= 0.75) return 'High';
    if (confidence >= 0.60) return 'Moderate';
    if (confidence >= 0.55) return 'Low';
    return 'Very Low';
};

/**
 * Get formatted win probability percentage
 */
export const formatWinProbability = (probability: number): string => {
    return `${(probability * 100).toFixed(1)}%`;
};

/**
 * Extract top decision factors for a game prediction
 */
export const getTopDecisionFactors = (
    prediction: GamePrediction, 
    limit: number = 3
): DecisionFactor[] => {
    return prediction.decision_factors
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, limit);
};

/**
 * Check if a game is a close matchup (within 10% probability difference)
 */
export const isCloseMatchup = (prediction: GamePrediction): boolean => {
    const diff = Math.abs(prediction.home_win_probability - prediction.away_win_probability);
    return diff <= 0.10;
};

/**
 * Get upset potential (predicted away team win with high confidence)
 */
export const getUpsetPotential = (prediction: GamePrediction): {
    isUpset: boolean;
    severity: string;
} => {
    const isUpset = prediction.predicted_winner === 'away';
    const severity = isUpset 
        ? getConfidenceLevel(prediction.confidence)
        : 'None';
    
    return { isUpset, severity };
};

// ===============================================
// PLAYER PERFORMANCE PARSING FUNCTIONS
// ===============================================

/**
 * Get top scorers from a game's player predictions
 */
export const getTopScorers = (
    playerPredictions: PlayerPrediction[],
    limit: number = 5
): PlayerPrediction[] => {
    return [...playerPredictions]
        .sort((a, b) => b.predicted_points - a.predicted_points)
        .slice(0, limit);
};

/**
 * Get top assist leaders from player predictions
 */
export const getTopAssists = (
    playerPredictions: PlayerPrediction[],
    limit: number = 5
): PlayerPrediction[] => {
    return [...playerPredictions]
        .sort((a, b) => b.predicted_assists - a.predicted_assists)
        .slice(0, limit);
};

/**
 * Get top rebounders from player predictions
 */
export const getTopRebounders = (
    playerPredictions: PlayerPrediction[],
    limit: number = 5
): PlayerPrediction[] => {
    return [...playerPredictions]
        .sort((a, b) => b.predicted_rebounds - a.predicted_rebounds)
        .slice(0, limit);
};

/**
 * Filter players by minimum stat threshold
 */
export const filterPlayersByStats = (
    playerPredictions: PlayerPrediction[],
    filters: {
        minPoints?: number;
        minAssists?: number;
        minRebounds?: number;
    }
): PlayerPrediction[] => {
    return playerPredictions.filter(player => {
        const meetsPoints = filters.minPoints === undefined || player.predicted_points >= filters.minPoints;
        const meetsAssists = filters.minAssists === undefined || player.predicted_assists >= filters.minAssists;
        const meetsRebounds = filters.minRebounds === undefined || player.predicted_rebounds >= filters.minRebounds;
        
        return meetsPoints && meetsAssists && meetsRebounds;
    });
};

/**
 * Get player's total fantasy points (simple scoring: 1pt = 1fp, 1ast = 1.5fp, 1reb = 1.2fp)
 */
export const calculateFantasyPoints = (player: PlayerPrediction): number => {
    return (
        player.predicted_points * 1.0 +
        player.predicted_assists * 1.5 +
        player.predicted_rebounds * 1.2
    );
};

/**
 * Rank players by fantasy points
 */
export const rankByFantasyPoints = (
    playerPredictions: PlayerPrediction[],
    limit?: number
): Array<PlayerPrediction & { fantasy_points: number }> => {
    const playersWithFP = playerPredictions.map(player => ({
        ...player,
        fantasy_points: calculateFantasyPoints(player)
    }));
    
    const sorted = playersWithFP.sort((a, b) => b.fantasy_points - a.fantasy_points);
    
    return limit ? sorted.slice(0, limit) : sorted;
};

/**
 * Get player decision factors for a specific stat
 */
export const getPlayerStatFactors = (
    player: PlayerPrediction,
    stat: 'points' | 'assists' | 'rebounds'
): DecisionFactor[] => {
    if (!player.decision_factors || !player.decision_factors[stat]) {
        return [];
    }
    return player.decision_factors[stat];
};

// ===============================================
// GAME DETAIL PARSING FUNCTIONS
// ===============================================

/**
 * Extract complete game summary with key players
 */
export const getGameSummary = (gameDetail: GameDetailPrediction) => {
    const homeTopScorer = getTopScorers(gameDetail.player_predictions.home_team, 1)[0];
    const awayTopScorer = getTopScorers(gameDetail.player_predictions.away_team, 1)[0];
    
    return {
        gameId: gameDetail.game_id,
        gameDate: gameDetail.game_date,
        winner: {
            teamId: gameDetail.game_outcome.predicted_winner === 'home' 
                ? gameDetail.game_outcome.home_team_id 
                : gameDetail.game_outcome.away_team_id,
            teamType: gameDetail.game_outcome.predicted_winner,
            probability: gameDetail.game_outcome.predicted_winner === 'home'
                ? gameDetail.game_outcome.home_win_probability
                : gameDetail.game_outcome.away_win_probability,
            confidence: gameDetail.game_outcome.confidence
        },
        topPerformers: {
            home: homeTopScorer,
            away: awayTopScorer
        },
        isCloseGame: Math.abs(
            gameDetail.game_outcome.home_win_probability - 
            gameDetail.game_outcome.away_win_probability
        ) <= 0.10,
        totalPlayers: gameDetail.summary.total_players
    };
};

/**
 * Get all players from both teams
 */
export const getAllPlayers = (gameDetail: GameDetailPrediction): PlayerPrediction[] => {
    return [
        ...gameDetail.player_predictions.home_team,
        ...gameDetail.player_predictions.away_team
    ];
};

/**
 * Compare team strengths based on predicted stats
 */
export const compareTeamStrengths = (gameDetail: GameDetailPrediction) => {
    const homeTeam = gameDetail.player_predictions.home_team;
    const awayTeam = gameDetail.player_predictions.away_team;
    
    const sumStat = (players: PlayerPrediction[], stat: keyof Pick<PlayerPrediction, 'predicted_points' | 'predicted_assists' | 'predicted_rebounds'>) => {
        return players.reduce((sum, player) => sum + player[stat], 0);
    };
    
    return {
        home: {
            teamId: gameDetail.game_outcome.home_team_id,
            totalPoints: sumStat(homeTeam, 'predicted_points'),
            totalAssists: sumStat(homeTeam, 'predicted_assists'),
            totalRebounds: sumStat(homeTeam, 'predicted_rebounds'),
            playerCount: homeTeam.length
        },
        away: {
            teamId: gameDetail.game_outcome.away_team_id,
            totalPoints: sumStat(awayTeam, 'predicted_points'),
            totalAssists: sumStat(awayTeam, 'predicted_assists'),
            totalRebounds: sumStat(awayTeam, 'predicted_rebounds'),
            playerCount: awayTeam.length
        }
    };
};

// ===============================================
// MULTI-GAME ANALYSIS FUNCTIONS
// ===============================================

/**
 * Get high confidence predictions from a list of games
 */
export const getHighConfidencePredictions = (
    predictions: GamePrediction[],
    minConfidence: number = 0.75
): GamePrediction[] => {
    return predictions.filter(pred => pred.confidence >= minConfidence);
};

/**
 * Get upset predictions (away team favored)
 */
export const getUpsetPredictions = (predictions: GamePrediction[]): GamePrediction[] => {
    return predictions.filter(pred => pred.predicted_winner === 'away');
};

/**
 * Get close games (probability difference < 10%)
 */
export const getCloseGames = (predictions: GamePrediction[]): GamePrediction[] => {
    return predictions.filter(isCloseMatchup);
};

/**
 * Group predictions by date
 */
export const groupByDate = (predictions: GamePrediction[]): Record<string, GamePrediction[]> => {
    return predictions.reduce((groups, prediction) => {
        const date = prediction.game_date.split('T')[0]; // Extract YYYY-MM-DD
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(prediction);
        return groups;
    }, {} as Record<string, GamePrediction[]>);
};

/**
 * Get games by team ID (home or away)
 */
export const getGamesByTeam = (
    predictions: GamePrediction[],
    teamId: number
): GamePrediction[] => {
    return predictions.filter(
        pred => pred.home_team_id === teamId || pred.away_team_id === teamId
    );
};

// ===============================================
// TOP PERFORMERS ANALYSIS FUNCTIONS
// ===============================================

/**
 * Filter top performers by stat category
 */
export const filterTopPerformersByStat = (
    performers: TopPerformer[],
    stat: 'points' | 'assists' | 'rebounds',
    minValue: number
): TopPerformer[] => {
    const statKey = `predicted_${stat}` as keyof TopPerformer;
    return performers.filter(p => (p[statKey] as number) >= minValue);
};

/**
 * Get multi-category stars (players excelling in multiple stats)
 */
export const getMultiCategoryStars = (
    performers: TopPerformer[],
    thresholds: {
        points?: number;
        assists?: number;
        rebounds?: number;
    }
): TopPerformer[] => {
    return performers.filter(player => {
        let categoriesExceeded = 0;
        
        if (thresholds.points && player.predicted_points >= thresholds.points) {
            categoriesExceeded++;
        }
        if (thresholds.assists && player.predicted_assists >= thresholds.assists) {
            categoriesExceeded++;
        }
        if (thresholds.rebounds && player.predicted_rebounds >= thresholds.rebounds) {
            categoriesExceeded++;
        }
        
        return categoriesExceeded >= 2; // Excel in at least 2 categories
    });
};

/**
 * Group top performers by game
 */
export const groupPerformersByGame = (performers: TopPerformer[]): Record<string, TopPerformer[]> => {
    return performers.reduce((groups, performer) => {
        if (!groups[performer.game_id]) {
            groups[performer.game_id] = [];
        }
        groups[performer.game_id].push(performer);
        return groups;
    }, {} as Record<string, TopPerformer[]>);
};

// ===============================================
// FORMATTING UTILITIES
// ===============================================

/**
 * Format player stats for display
 */
export const formatPlayerStats = (player: PlayerPrediction): string => {
    return `${player.predicted_points.toFixed(1)} PTS / ${player.predicted_rebounds.toFixed(1)} REB / ${player.predicted_assists.toFixed(1)} AST`;
};

/**
 * Format game outcome for display
 */
export const formatGameOutcome = (prediction: GamePrediction): string => {
    const winner = prediction.predicted_winner === 'home' ? 'Home' : 'Away';
    const probability = formatWinProbability(prediction.confidence);
    return `${winner} Team (${probability} confidence)`;
};

/**
 * Format decision factor for display
 */
export const formatDecisionFactor = (factor: DecisionFactor): string => {
    return `${factor.factor}: ${factor.value.toFixed(2)} (${(factor.contribution * 100).toFixed(1)}% impact)`;
};

// ===============================================
// EXPORT ALL UTILITIES
// ===============================================

export default {
    // Game outcome functions
    getWinnerInfo,
    getConfidenceLevel,
    formatWinProbability,
    getTopDecisionFactors,
    isCloseMatchup,
    getUpsetPotential,
    
    // Player performance functions
    getTopScorers,
    getTopAssists,
    getTopRebounders,
    filterPlayersByStats,
    calculateFantasyPoints,
    rankByFantasyPoints,
    getPlayerStatFactors,
    
    // Game detail functions
    getGameSummary,
    getAllPlayers,
    compareTeamStrengths,
    
    // Multi-game analysis
    getHighConfidencePredictions,
    getUpsetPredictions,
    getCloseGames,
    groupByDate,
    getGamesByTeam,
    
    // Top performers analysis
    filterTopPerformersByStat,
    getMultiCategoryStars,
    groupPerformersByGame,
    
    // Formatting utilities
    formatPlayerStats,
    formatGameOutcome,
    formatDecisionFactor
};
