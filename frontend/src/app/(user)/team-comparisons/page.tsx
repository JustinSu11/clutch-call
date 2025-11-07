/*
    File: frontend/src/app/(user)/team-comparisons/page.tsx
    Created: 11/06/2025 by CJ Quintero
    Last Updated: 11/06/2025 by CJ Quintero

    Description: This file contains everything to display
    the team comparisons page for the user.

    NOTE:: Due to the API's limitations, only NFL previous game stats
    are fully functional at this time.
*/
'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { parseNFLPreviousGameStats } from '@/utils/nfl_parser';
import { parseMLSPreviousGameStats } from '@/utils/mls_parser';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

type SportKey = 'NFL' | 'NBA' | 'MLS';

// component for the sports filter
const SportsFilter: React.FC<{
    sports: SportKey[];
    activeSport: SportKey;
    setActiveSport: (sport: SportKey) => void;
}> = ({ sports, activeSport, setActiveSport }) => (
    <div className="text-text-primary mb-4">
        {sports.map((sport) => (
            <button
                key={sport}
                onClick={() => setActiveSport(sport)}
                className={`px-4 py-2 text-sm text-text-primary font-medium rounded-md whitespace-nowrap ${
                    activeSport === sport
                        ? 'bg-secondary text-text-primary'
                        : 'hover:text-primary'
                } cursor-pointer mr-2`}
            >
                {sport}
            </button>
        ))}
    </div>
);

// Team dropdown component
const TeamDropdown: React.FC<{
    teams: string[];
    selectedTeam: string | null;
    setSelectedTeam: (team: string) => void;
}> = ({ teams, selectedTeam, setSelectedTeam }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative inline-block text-left">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-80 px-6 py-4 text-lg font-medium text-text-primary bg-secondary-background rounded-md hover:bg-opacity-80 focus:outline-none flex items-center justify-between cursor-pointer"
            >
                <span>{selectedTeam || 'Select a team'}</span>
                <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <div
                className={[
                    "absolute mt-2 w-80 rounded-md shadow-lg bg-secondary-background z-10",
                    "max-h-60 overflow-y-auto scrollbar-hide origin-top",
                    "transition-[opacity,transform] duration-200 ease-out",
                    isOpen
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                ].join(" ")}
                aria-hidden={!isOpen}
                >
                {teams.map((team) => (
                    <button
                    key={team}
                    onClick={() => { setSelectedTeam(team); setIsOpen(false); }}
                    className={`block w-full text-left px-6 py-3 text-base hover:bg-secondary ${
                        selectedTeam === team ? 'bg-secondary text-text-primary font-semibold' : 'text-text-primary'
                    }`}
                    >
                    {team}
                    </button>
                ))}
            </div>
        </div>
    );
};


export default function Page() {
    const sports: SportKey[] = ['NFL', 'NBA', 'MLS'];
    const [activeSport, setActiveSport] = useState<SportKey>('NFL');
    const [team1, setTeam1] = useState<string | null>(null);
    const [team2, setTeam2] = useState<string | null>(null);
    const [team1Stats, setTeam1Stats] = useState<number[]>([]);
    const [team2Stats, setTeam2Stats] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Team mappings matching your backend
    const teamsData: Record<SportKey, string[]> = {
        NFL: [
            'Arizona Cardinals',
            'Atlanta Falcons',
            'Baltimore Ravens',
            'Buffalo Bills',
            'Carolina Panthers',
            'Chicago Bears',
            'Cincinnati Bengals',
            'Cleveland Browns',
            'Dallas Cowboys',
            'Denver Broncos',
            'Detroit Lions',
            'Green Bay Packers',
            'Houston Texans',
            'Indianapolis Colts',
            'Jacksonville Jaguars',
            'Kansas City Chiefs',
            'Las Vegas Raiders',
            'Los Angeles Chargers',
            'Los Angeles Rams',
            'Miami Dolphins',
            'Minnesota Vikings',
            'New England Patriots',
            'New Orleans Saints',
            'New York Giants',
            'New York Jets',
            'Philadelphia Eagles',
            'Pittsburgh Steelers',
            'San Francisco 49ers',
            'Seattle Seahawks',
            'Tampa Bay Buccaneers',
            'Tennessee Titans',
            'Washington Commanders'
        ],
        NBA: [
            'Atlanta Hawks',
            'Boston Celtics',
            'Brooklyn Nets',
            'Charlotte Hornets',
            'Chicago Bulls',
            'Cleveland Cavaliers',
            'Dallas Mavericks',
            'Denver Nuggets',
            'Detroit Pistons',
            'Golden State Warriors',
            'Houston Rockets',
            'Indiana Pacers',
            'Los Angeles Clippers',
            'Los Angeles Lakers',
            'Memphis Grizzlies',
            'Miami Heat',
            'Milwaukee Bucks',
            'Minnesota Timberwolves',
            'New Orleans Pelicans',
            'New York Knicks',
            'Oklahoma City Thunder',
            'Orlando Magic',
            'Philadelphia 76ers',
            'Phoenix Suns',
            'Portland Trail Blazers',
            'Sacramento Kings',
            'San Antonio Spurs',
            'Toronto Raptors',
            'Utah Jazz',
            'Washington Wizards'
        ],
        MLS: [
            'Atlanta United FC',
            'Austin FC',
            'CF Montréal',
            'Charlotte FC',
            'Chicago Fire FC',
            'Colorado Rapids',
            'Columbus Crew',
            'D.C. United',
            'FC Cincinnati',
            'FC Dallas',
            'Houston Dynamo FC',
            'Inter Miami CF',
            'LA Galaxy',
            'Los Angeles FC',
            'Minnesota United FC',
            'Nashville SC',
            'New England Revolution',
            'New York City FC',
            'New York Red Bulls',
            'Orlando City SC',
            'Philadelphia Union',
            'Portland Timbers',
            'Real Salt Lake',
            'San Jose Earthquakes',
            'Seattle Sounders FC',
            'Sporting Kansas City',
            'St. Louis City SC',
            'Toronto FC',
            'Vancouver Whitecaps FC'
        ]
    };

    // Reset team selections when sport changes
    useEffect(() => {
        setTeam1(null);
        setTeam2(null);
        setTeam1Stats([]);
        setTeam2Stats([]);
    }, [activeSport]);

    // Fetch stats when teams are selected
    useEffect(() => {
        const fetchStats = async () => {
            if (!team1 && !team2) return;

            if (team1 && team2 && team1 === team2) {
                setError("Can't compare a team to itself");
                setTeam1Stats([]);
                setTeam2Stats([]);
                return;
            }
            
            setLoading(true);
            try {
                if (team1) {
                    let stats: number[] = [];
                    if (activeSport === 'NFL') {
                        stats = await parseNFLPreviousGameStats(team1);
                    } else if (activeSport === 'MLS') {
                        stats = await parseMLSPreviousGameStats(team1);
                    }
                    setTeam1Stats(stats);
                }
                
                if (team2) {
                    let stats: number[] = [];
                    if (activeSport === 'NFL') {
                        stats = await parseNFLPreviousGameStats(team2);
                    } else if (activeSport === 'MLS') {
                        stats = await parseMLSPreviousGameStats(team2);
                    }
                    setTeam2Stats(stats);
                }
            } catch (error) {
                console.error('Error fetching team stats:', error);
            } finally {
                setLoading(false);
            }
            setError(null); // Clear error if fetch is successful
        };

        fetchStats();
    }, [team1, team2, activeSport]);

    // Calculate averages for the bar chart
    const team1Average = team1Stats.length > 0 ? parseFloat((team1Stats.reduce((a, b) => a + b, 0) / team1Stats.length).toFixed(1)) : 0;
    const team2Average = team2Stats.length > 0 ? parseFloat((team2Stats.reduce((a, b) => a + b, 0) / team2Stats.length).toFixed(1)) : 0;

    // Highcharts configuration for the new bar chart
    const barChartOptions: Highcharts.Options = {
        chart: {
            type: 'column',
            backgroundColor: '',
        },
        title: {
            text: 'Average Points Comparison',
            style: { color: 'var(--color-text-primary)' }
        },
        xAxis: {
            categories: ['Average Points'],
            labels: { style: { color: 'var(--color-text-primary)' } }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Points',
                style: { color: 'var(--color-text-primary)' }
            },
            labels: { style: { color: 'var(--color-text-primary)' } },
            gridLineColor: '#333333'
        },
        legend: {
            itemStyle: { color: 'var(--color-text-primary)' }
        },
        tooltip: {
            pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y:.1f}</b><br/>',
            shared: true,
            backgroundColor: '#2a2a2a',
            style: { color: 'var(--color-text-primary)' }
        },
        series: [
            {
                name: team1 || 'Team 1',
                data: [team1Average],
                color: '#3b82f6',
                type: 'column'
            },
            {
                name: team2 || 'Team 2',
                data: [team2Average],
                color: '#ef4444',
                type: 'column'
            }
        ]
    };

    // Highcharts configuration
    const chartOptions: Highcharts.Options = {
        chart: {
            type: 'line',
            backgroundColor: '',
        },
        title: {
            text: 'Team Performance Comparison',
            style: {
                color: 'var(--color-text-primary)'
            }
        },
        xAxis: {
            title: {
                text: 'Game Number',
                style: { color: 'var(--color-text-primary)' }
            },
            labels: {
                style: { color: 'var(--color-text-primary)' }
            },
            gridLineColor: '#333333',
            min: 1,
            tickInterval: 1
        },
        yAxis: {
            title: {
                text: 'Points Scored',
                style: { color: 'var(--color-text-primary)' }
            },
            labels: {
                style: { color: 'var(--color-text-primary)' }
            },
            gridLineColor: '#333333'
        },
        legend: {
            itemStyle: {
                color: 'var(--color-text-primary)'
            }
        },
        tooltip: {
            shared: true,
            backgroundColor: '#2a2a2a',
            style: {
                color: 'var(--color-text-primary)'
            }
        },
        plotOptions: {
            line: {
                dataLabels: {
                    enabled: false
                },
                enableMouseTracking: true,
                pointStart: 1
            }
        },
        series: [
            {
                name: team1 || 'Team 1',
                data: team1Stats,
                color: '#3b82f6',
                type: 'line'
            },
            {
                name: team2 || 'Team 2',
                data: team2Stats,
                color: '#ef4444',
                type: 'line'
            }
        ]
    };

    return (
        <div className="p-6">
            <h1 className="text-4xl font-bold text-text-primary mb-6 text-center">Team Comparisons</h1>
            
            <div className="flex justify-center mb-6">
                <SportsFilter sports={sports} activeSport={activeSport} setActiveSport={setActiveSport} />
            </div>
            
            <div className="flex justify-between items-center gap-6 mt-6">
                <div className="flex flex-col flex-1">
                    <label className="block text-lg font-medium text-text-primary mb-3">Team 1</label>
                    <TeamDropdown 
                        teams={teamsData[activeSport]} 
                        selectedTeam={team1} 
                        setSelectedTeam={setTeam1} 
                    />
                </div>
                
                
                <div className="flex items-center justify-center mt-8">
                    <span className="text-4xl font-bold text-text-primary">VS</span>
                </div>

                <div className="flex flex-col flex-1 items-end">
                    <label className="block text-lg font-medium text-text-primary mb-3">Team 2</label>
                    <TeamDropdown 
                        teams={teamsData[activeSport]} 
                        selectedTeam={team2} 
                        setSelectedTeam={setTeam2} 
                    />
                </div>
            </div>

            {/* Display stats */}
            {loading && <p className="text-center text-text-primary mt-6">Loading stats...</p>}
            
            {error && (
                <div className="text-center text-red-500 mt-6 text-lg font-semibold">
                    {error}
                </div>
            )}
            {!loading && (team1 || team2) && (
                <>
                    {/* Charts Container */}
                    {(team1Stats.length > 0 || team2Stats.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            {/* Line Chart */}
                            <div className="bg-secondary-background p-6 rounded-md">
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    options={chartOptions}
                                />
                            </div>
                            {/* Bar Chart */}
                            <div className="bg-secondary-background p-6 rounded-md">
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    options={barChartOptions}
                                />
                            </div>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="flex justify-between gap-6 mt-8">
                        <div className="flex-1">
                            {team1 && (
                                <div className="bg-secondary-background p-4 rounded-md">
                                    <h3 className="text-xl font-semibold text-text-primary mb-2">{team1}</h3>
                                    <p className="text-text-primary">Previous Game Scores: {team1Stats.join(', ') || 'No data'}</p>
                                    <p className="text-text-primary text-sm mt-2">
                                        Average: {team1Stats.length > 0 ? (team1Stats.reduce((a, b) => a + b, 0) / team1Stats.length).toFixed(1) : 'N/A'}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1">
                            {team2 && (
                                <div className="bg-secondary-background p-4 rounded-md">
                                    <h3 className="text-xl font-semibold text-text-primary mb-2">{team2}</h3>
                                    <p className="text-text-primary">Previous Game Scores: {team2Stats.join(', ') || 'No data'}</p>
                                    <p className="text-text-primary text-sm mt-2">
                                        Average: {team2Stats.length > 0 ? (team2Stats.reduce((a, b) => a + b, 0) / team2Stats.length).toFixed(1) : 'N/A'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}