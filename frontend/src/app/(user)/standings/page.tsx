/*
    File: frontend/src/app/(user)/standings/page.tsx
    Created: 2025-10-17
    
    Description: Standings page displaying current standings for NBA, NFL, and Soccer leagues
    with unique visuals, animations, and playoff bracket support.
*/
"use client";
import React, { useState, useEffect } from 'react';
import { getNBAStandings, getNFLStandings, getSoccerStandings } from '@/backend_methods/standings_methods';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

type SportKey = 'NBA' | 'NFL' | 'MLS';

type NBATeam = {
    team_id: number;
    team_name: string;
    team_city: string;
    team_abbreviation: string;
    team_logo: string;
    conference: string;
    division: string;
    wins: number;
    losses: number;
    win_pct: number;
    home_record: string;
    road_record: string;
    last_10: string;
    streak: string | number | null;
    games_back: number;
};

type NFLTeam = {
    team_id: string;
    team_name: string;
    team_abbreviation: string;
    team_logo: string;
    conference: string;
    division: string | null;
    wins: number;
    losses: number;
    ties: number;
    win_pct: number;
    points_for: number;
    points_against: number;
    point_differential: number;
    streak: string | number | null;
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

const StreakIndicator: React.FC<{ streak: string | number | null | undefined }> = ({ streak }) => {
    if (!streak) return null;
    
    // Convert to string if it's not already
    const streakStr = String(streak);
    const isWinStreak = streakStr.startsWith('W');
    const isLoseStreak = streakStr.startsWith('L');
    
    return (
        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
            isWinStreak ? 'bg-green-500/20 text-green-400' :
            isLoseStreak ? 'bg-red-500/20 text-red-400' :
            'bg-gray-500/20 text-gray-400'
        }`}>
            {isWinStreak && <TrendingUp size={12} />}
            {isLoseStreak && <TrendingDown size={12} />}
            {!isWinStreak && !isLoseStreak && <Minus size={12} />}
            {streakStr}
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
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-secondary text-text-secondary">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Team</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">W</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">L</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">PCT</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">GB</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Home</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Away</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">L10</th>
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
                                                <div className="flex items-center gap-3">
                                                    {team.team_logo && (
                                                        <img src={team.team_logo} alt={`${team.team_city} ${team.team_name}`} className="w-8 h-8 object-contain" />
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-text-primary">{team.team_city} {team.team_name}</div>
                                                        <div className="text-xs text-text-secondary">{team.division}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-green-400">{team.wins}</td>
                                            <td className="px-4 py-4 text-center font-bold text-red-400">{team.losses}</td>
                                            <td className="px-4 py-4 text-center text-text-primary font-semibold">{team.win_pct.toFixed(3)}</td>
                                            <td className="px-4 py-4 text-center text-text-secondary">{team.games_back || '-'}</td>
                                            <td className="px-4 py-4 text-center text-text-secondary text-sm hidden md:table-cell">{team.home_record}</td>
                                            <td className="px-4 py-4 text-center text-text-secondary text-sm hidden md:table-cell">{team.road_record}</td>
                                            <td className="px-4 py-4 text-center text-text-secondary text-sm hidden lg:table-cell">{team.last_10}</td>
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
                <div className="flex flex-wrap gap-4 mt-4 text-sm">
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
        if (!teams || teams.length === 0) {
            return (
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-2xl font-bold text-text-primary">{conferenceName}</h3>
                        <div className="h-1 flex-grow bg-gradient-to-r from-primary to-transparent rounded"></div>
                    </div>
                    <div className="bg-secondary-background rounded-xl p-8 text-center">
                        <p className="text-text-secondary">No {conferenceName} standings data available</p>
                    </div>
                </div>
            );
        }
        
        // Sort teams by wins and win percentage
        const sortedTeams = [...teams].sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.win_pct - a.win_pct;
        });
        
        // Group teams by division to determine division winners
        // Division winners are teams ranked #1 in their division (typically top 4 seeds)
        // Wildcard teams are the remaining playoff teams (typically seeds 5-7)
        const divisionWinners: NFLTeam[] = [];
        const wildcardTeams: NFLTeam[] = [];
        const nonPlayoffTeams: NFLTeam[] = [];
        
        // Group teams by division
        const divisionGroups: { [key: string]: NFLTeam[] } = {};
        sortedTeams.forEach(team => {
            const division = team.division || 'Unknown';
            if (!divisionGroups[division]) {
                divisionGroups[division] = [];
            }
            divisionGroups[division].push(team);
        });
        
        // Get division winners (top team in each division)
        Object.values(divisionGroups).forEach(divisionTeams => {
            if (divisionTeams.length > 0) {
                // Sort division teams by wins
                divisionTeams.sort((a, b) => {
                    if (b.wins !== a.wins) return b.wins - a.wins;
                    return b.win_pct - a.win_pct;
                });
                divisionWinners.push(divisionTeams[0]);
            }
        });
        
        // Sort division winners by wins
        divisionWinners.sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.win_pct - a.win_pct;
        });
        
        // Get wildcard teams (remaining playoff teams that aren't division winners)
        const divisionWinnerIds = new Set(divisionWinners.map(t => t.team_id));
        sortedTeams.forEach(team => {
            if (divisionWinnerIds.has(team.team_id)) {
                // Already in division winners
            } else if (divisionWinners.length + wildcardTeams.length < 7) {
                // Top 7 teams make playoffs, so add to wildcard if we haven't reached 7 yet
                wildcardTeams.push(team);
            } else {
                nonPlayoffTeams.push(team);
            }
        });
        
        // Combine: division winners first, then wildcard teams, then non-playoff
        const finalSortedTeams = [...divisionWinners, ...wildcardTeams, ...nonPlayoffTeams];
        
        return (
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-2xl font-bold text-text-primary">{conferenceName}</h3>
                    <div className="h-1 flex-grow bg-gradient-to-r from-primary to-transparent rounded"></div>
                </div>
                
                <div className="bg-secondary-background rounded-xl overflow-hidden shadow-lg border border-secondary">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-secondary text-text-secondary">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Team</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">W</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">L</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">T</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">PCT</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider hidden md:table-cell">PF</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider hidden md:table-cell">PA</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">Diff</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Streak</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary">
                                {finalSortedTeams.map((team, idx) => {
                                    const isDivisionWinner = divisionWinners.some(dw => dw.team_id === team.team_id);
                                    const isWildcardTeam = wildcardTeams.some(wt => wt.team_id === team.team_id);
                                    const isPlayoffTeam = isDivisionWinner || isWildcardTeam;
                                    
                                    return (
                                        <tr 
                                            key={team.team_id}
                                            className={`hover:bg-secondary transition-colors ${
                                                isDivisionWinner ? 'border-l-4 border-l-green-500' :
                                                isWildcardTeam ? 'border-l-4 border-l-yellow-500' : ''
                                            }`}
                                        >
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center gap-2 justify-center">
                                                    {isPlayoffTeam && <Trophy size={16} className={isDivisionWinner ? "text-green-500" : "text-yellow-500"} />}
                                                    <span className={`font-bold ${
                                                        isDivisionWinner ? 'text-green-500' : 
                                                        isWildcardTeam ? 'text-yellow-500' : 
                                                        'text-text-secondary'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    {team.team_logo && (
                                                        <img src={team.team_logo} alt={team.team_name} className="w-8 h-8 object-contain" />
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-text-primary">
                                                            {team.team_name}
                                                        </div>
                                                        <div className="text-xs text-text-secondary">{team.team_abbreviation}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-green-400">{team.wins}</td>
                                            <td className="px-4 py-4 text-center font-bold text-red-400">{team.losses}</td>
                                            <td className="px-4 py-4 text-center text-text-secondary">{team.ties}</td>
                                            <td className="px-4 py-4 text-center text-text-primary font-semibold">{team.win_pct.toFixed(3)}</td>
                                            <td className="px-4 py-4 text-center text-text-secondary text-sm hidden md:table-cell">{team.points_for}</td>
                                            <td className="px-4 py-4 text-center text-text-secondary text-sm hidden md:table-cell">{team.points_against}</td>
                                            <td className={`px-4 py-4 text-center font-semibold hidden lg:table-cell ${team.point_differential > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {team.point_differential > 0 ? '+' : ''}{team.point_differential}
                                            </td>
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
                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-text-secondary">Division Winners (Top 4)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="text-text-secondary">Wildcard Teams (5-7)</span>
                    </div>
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
                    <table className="w-full min-w-[700px]">
                        <thead className="bg-secondary text-text-secondary">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Team</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">GP</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">W</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">D</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">L</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider hidden md:table-cell">GF</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider hidden md:table-cell">GA</th>
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
                                    <td className="px-4 py-4 text-center text-text-secondary hidden md:table-cell">{team.goals_for}</td>
                                    <td className="px-4 py-4 text-center text-text-secondary hidden md:table-cell">{team.goals_against}</td>
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
    const [nbaStandings, setNbaStandings] = useState<{ eastern_conference: NBATeam[], western_conference: NBATeam[] } | null>(null);
    const [nflStandings, setNflStandings] = useState<{ afc_standings: NFLTeam[], nfc_standings: NFLTeam[] } | null>(null);
    const [soccerStandings, setSoccerStandings] = useState<{ standings: SoccerTeam[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStandings = async () => {
            setLoading(true);
            setError(null);
            
            try {
                if (activeSport === 'NBA' && !nbaStandings) {
                    const data = await getNBAStandings();
                    console.log('NBA Standings Data:', data);
                    setNbaStandings(data);
                } else if (activeSport === 'NFL' && !nflStandings) {
                    const data = await getNFLStandings();
                    console.log('NFL Standings Data:', data);
                    if (data.error) {
                        setError(`NFL API Error: ${data.error}`);
                    } else if (!data.afc_standings || data.afc_standings.length === 0) {
                        setError('No NFL standings data available. The API may be temporarily unavailable.');
                    } else {
                        setNflStandings(data);
                    }
                } else if (activeSport === 'MLS' && !soccerStandings) {
                    const data = await getSoccerStandings('MLS');
                    console.log('Soccer Standings Data:', data);
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
