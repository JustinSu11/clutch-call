/*
    File: frontend/src/app/(user)/standings/page.tsx
    Created: 2025-10-17
    
    Description: Standings page displaying current standings for NBA, NFL, and Soccer leagues
    with unique visuals, animations, and playoff bracket support.
*/
"use client";
import React, { useState, useEffect } from 'react';
import { getNBAStandings, getNFLStandings, getSoccerStandings } from '@/backend_methods/standings_methods';
import { Trophy, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';

type SportKey = 'NBA' | 'NFL' | 'MLS';

type NBATeam = {
    team_id: number;
    team_name: string;
    team_city: string;
    conference: string;
    division: string;
    wins: number;
    losses: number;
    win_pct: number;
    home_record: string;
    road_record: string;
    last_10: string;
    streak: string;
    games_back: number;
};

type NFLTeam = {
    team_id: string;
    team_name: string;
    team_abbreviation: string;
    team_logo: string;
    conference: string;
    wins: number;
    losses: number;
    ties: number;
    win_pct: number;
    points_for: number;
    points_against: number;
    point_differential: number;
    streak: string;
    division_rank: number;
    conference_rank: number;
    playoff_seed: number;
};

type SoccerTeam = {
    team_id: string;
    team_name: string;
    team_abbreviation: string;
    team_logo: string;
    group: string;
    rank: number;
    wins: number;
    losses: number;
    draws: number;
    points: number;
    goals_for: number;
    goals_against: number;
    goal_differential: number;
    games_played: number;
};

const SportsFilter: React.FC<{
    sports: SportKey[];
    activeSport: SportKey;
    setActiveSport: (sport: SportKey) => void;
}> = ({ sports, activeSport, setActiveSport }) => (
    <div className="flex gap-2 mb-6 flex-wrap">
        {sports.map((sport) => (
            <button
                key={sport}
                onClick={() => setActiveSport(sport)}
                className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    activeSport === sport
                        ? 'bg-primary text-white shadow-lg scale-105'
                        : 'bg-secondary-background text-text-primary hover:bg-secondary hover:scale-102'
                }`}
            >
                {sport}
            </button>
        ))}
    </div>
);

const StreakIndicator: React.FC<{ streak: string }> = ({ streak }) => {
    if (!streak) return null;
    
    const isWinStreak = streak.startsWith('W');
    const isLoseStreak = streak.startsWith('L');
    
    return (
        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
            isWinStreak ? 'bg-green-500/20 text-green-400' :
            isLoseStreak ? 'bg-red-500/20 text-red-400' :
            'bg-gray-500/20 text-gray-400'
        }`}>
            {isWinStreak && <TrendingUp size={12} />}
            {isLoseStreak && <TrendingDown size={12} />}
            {!isWinStreak && !isLoseStreak && <Minus size={12} />}
            {streak}
        </span>
    );
};

const NBAStandingsDisplay: React.FC<{ standings: { eastern_conference: NBATeam[], western_conference: NBATeam[] } }> = ({ standings }) => {
    const renderConference = (teams: NBATeam[], conferenceName: string) => {
        // Determine playoff cutoff (typically top 10 teams make playoffs, top 6 automatic, 7-10 play-in)
        const playoffCutoff = 6;
        const playInCutoff = 10;
        
        return (
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-2xl font-bold text-text-primary">{conferenceName}</h3>
                    <div className="h-1 flex-grow bg-gradient-to-r from-primary to-transparent rounded"></div>
                </div>
                <div className="bg-secondary-background rounded-xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary text-text-secondary">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Team</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">W</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">L</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">PCT</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">GB</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Home</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Away</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">L10</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Streak</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary">
                                {teams.map((team, idx) => {
                                    const isPlayoffTeam = idx < playoffCutoff;
                                    const isPlayInTeam = idx >= playoffCutoff && idx < playInCutoff;
                                    
                                    return (
                                        <tr 
                                            key={team.team_id} 
                                            className={`hover:bg-secondary transition-colors ${
                                                isPlayoffTeam ? 'border-l-4 border-l-green-500' :
                                                isPlayInTeam ? 'border-l-4 border-l-yellow-500' : ''
                                            }`}
                                        >
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center gap-2">
                                                    {isPlayoffTeam && <Trophy size={16} className="text-green-500" />}
                                                    <span className="font-bold text-text-primary">{idx + 1}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-semibold text-text-primary">{team.team_city} {team.team_name}</div>
                                                <div className="text-xs text-text-secondary">{team.division}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-green-400">{team.wins}</td>
                                            <td className="px-4 py-4 text-center font-bold text-red-400">{team.losses}</td>
                                            <td className="px-4 py-4 text-center text-text-primary font-semibold">{team.win_pct.toFixed(3)}</td>
                                            <td className="px-4 py-4 text-center text-text-secondary">{team.games_back || '-'}</td>
                                            <td className="px-4 py-4 text-center text-text-secondary text-sm">{team.home_record}</td>
                                            <td className="px-4 py-4 text-center text-text-secondary text-sm">{team.road_record}</td>
                                            <td className="px-4 py-4 text-center text-text-secondary text-sm">{team.last_10}</td>
                                            <td className="px-4 py-4 text-center">
                                                <StreakIndicator streak={team.streak} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* Playoff Legend */}
                <div className="flex gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-text-secondary">Playoff Teams (1-6)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="text-text-secondary">Play-In Teams (7-10)</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            {renderConference(standings.eastern_conference, "Eastern Conference")}
            {renderConference(standings.western_conference, "Western Conference")}
        </div>
    );
};

const NFLStandingsDisplay: React.FC<{ standings: { afc_standings: NFLTeam[], nfc_standings: NFLTeam[] } }> = ({ standings }) => {
    const renderConference = (teams: NFLTeam[], conferenceName: string) => {
        const playoffCutoff = 7; // Top 7 teams make playoffs
        
        return (
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-2xl font-bold text-text-primary">{conferenceName}</h3>
                    <div className="h-1 flex-grow bg-gradient-to-r from-primary to-transparent rounded"></div>
                </div>
                <div className="grid gap-3">
                    {teams.map((team, idx) => {
                        const isPlayoffTeam = idx < playoffCutoff;
                        
                        return (
                            <div 
                                key={team.team_id}
                                className={`bg-secondary-background rounded-xl p-4 hover:bg-secondary transition-all duration-300 hover:scale-102 ${
                                    isPlayoffTeam ? 'border-l-4 border-l-green-500' : ''
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            {isPlayoffTeam && <Trophy size={20} className="text-green-500" />}
                                            <span className="text-2xl font-bold text-text-primary w-8">{idx + 1}</span>
                                        </div>
                                        {team.team_logo && (
                                            <img src={team.team_logo} alt={team.team_name} className="w-12 h-12 object-contain" />
                                        )}
                                        <div>
                                            <div className="font-bold text-lg text-text-primary">{team.team_name}</div>
                                            <div className="text-sm text-text-secondary">{team.team_abbreviation}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-text-primary">
                                                {team.wins}-{team.losses}{team.ties > 0 && `-${team.ties}`}
                                            </div>
                                            <div className="text-xs text-text-secondary">Record</div>
                                        </div>
                                        
                                        <div className="text-center">
                                            <div className="text-lg font-semibold text-text-primary">{team.win_pct.toFixed(3)}</div>
                                            <div className="text-xs text-text-secondary">PCT</div>
                                        </div>
                                        
                                        <div className="text-center">
                                            <div className={`text-lg font-bold ${team.point_differential > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {team.point_differential > 0 ? '+' : ''}{team.point_differential}
                                            </div>
                                            <div className="text-xs text-text-secondary">Diff</div>
                                        </div>
                                        
                                        {team.streak && (
                                            <StreakIndicator streak={team.streak} />
                                        )}
                                        
                                        <ChevronRight className="text-text-secondary" size={20} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <div className="flex items-center gap-2 mt-4 text-sm">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-text-secondary">Playoff Teams (Top 7)</span>
                </div>
            </div>
        );
    };

    return (
        <div>
            {renderConference(standings.afc_standings, "AFC")}
            {renderConference(standings.nfc_standings, "NFC")}
        </div>
    );
};

const SoccerStandingsDisplay: React.FC<{ standings: SoccerTeam[], league: string }> = ({ standings, league }) => {
    return (
        <div>
            <div className="flex items-center gap-3 mb-4">
                <h3 className="text-2xl font-bold text-text-primary">{league} Standings</h3>
                <div className="h-1 flex-grow bg-gradient-to-r from-primary to-transparent rounded"></div>
            </div>
            
            <div className="bg-secondary-background rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary text-text-secondary">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Team</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">GP</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">W</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">D</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">L</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">GF</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">GA</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">GD</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">PTS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary">
                            {standings.map((team, idx) => (
                                <tr key={team.team_id} className="hover:bg-secondary transition-colors">
                                    <td className="px-4 py-4">
                                        <span className="font-bold text-text-primary">{idx + 1}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            {team.team_logo && (
                                                <img src={team.team_logo} alt={team.team_name} className="w-8 h-8 object-contain" />
                                            )}
                                            <div>
                                                <div className="font-semibold text-text-primary">{team.team_name}</div>
                                                {team.group && <div className="text-xs text-text-secondary">{team.group}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center text-text-secondary">{team.games_played}</td>
                                    <td className="px-4 py-4 text-center font-bold text-green-400">{team.wins}</td>
                                    <td className="px-4 py-4 text-center font-bold text-yellow-400">{team.draws}</td>
                                    <td className="px-4 py-4 text-center font-bold text-red-400">{team.losses}</td>
                                    <td className="px-4 py-4 text-center text-text-secondary">{team.goals_for}</td>
                                    <td className="px-4 py-4 text-center text-text-secondary">{team.goals_against}</td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`font-semibold ${team.goal_differential > 0 ? 'text-green-400' : team.goal_differential < 0 ? 'text-red-400' : 'text-text-secondary'}`}>
                                            {team.goal_differential > 0 ? '+' : ''}{team.goal_differential}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="font-bold text-lg text-primary">{team.points}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default function StandingsPage() {
    const sports: SportKey[] = ['NBA', 'NFL', 'MLS'];
    const [activeSport, setActiveSport] = useState<SportKey>('NBA');
    const [nbaStandings, setNbaStandings] = useState<any>(null);
    const [nflStandings, setNflStandings] = useState<any>(null);
    const [soccerStandings, setSoccerStandings] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStandings = async () => {
            setLoading(true);
            setError(null);
            
            try {
                if (activeSport === 'NBA' && !nbaStandings) {
                    const data = await getNBAStandings();
                    setNbaStandings(data);
                } else if (activeSport === 'NFL' && !nflStandings) {
                    const data = await getNFLStandings();
                    setNflStandings(data);
                } else if (activeSport === 'MLS' && !soccerStandings) {
                    const data = await getSoccerStandings('MLS');
                    setSoccerStandings(data);
                }
            } catch (err) {
                setError(`Failed to load ${activeSport} standings. Please try again later.`);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStandings();
    }, [activeSport, nbaStandings, nflStandings, soccerStandings]);

    return (
        <div className="min-h-screen">
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <Trophy className="text-primary" size={40} />
                    <div>
                        <h1 className="text-4xl font-bold text-text-primary">League Standings</h1>
                        <p className="text-text-secondary mt-1">Current standings and playoff positions</p>
                    </div>
                </div>
            </div>

            <SportsFilter sports={sports} activeSport={activeSport} setActiveSport={setActiveSport} />

            {loading && (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-xl p-6 text-center">
                    <p className="text-red-400 font-semibold">{error}</p>
                </div>
            )}

            {!loading && !error && (
                <>
                    {activeSport === 'NBA' && nbaStandings && (
                        <NBAStandingsDisplay standings={nbaStandings} />
                    )}
                    {activeSport === 'NFL' && nflStandings && (
                        <NFLStandingsDisplay standings={nflStandings} />
                    )}
                    {activeSport === 'MLS' && soccerStandings && (
                        <SoccerStandingsDisplay standings={soccerStandings.standings} league="MLS" />
                    )}
                </>
            )}
        </div>
    );
}
