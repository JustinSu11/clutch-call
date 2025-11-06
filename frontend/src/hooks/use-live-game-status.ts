/*
    File: src/hooks/use-live-game-status.ts
    Created: 2025-11-05
    
    Description: Hook to poll live game status and data every 12 seconds
*/

/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'

import { useState, useEffect, useRef } from 'react';
import { LiveGameData, GameStatus } from '@/utils/data_class';
import * as sports_stats_methods from '@/backend_methods/sports_stats_methods';

const POLL_INTERVAL = 12000; // 12 seconds

// League-specific adapters to normalize period/clock text
const leagueAdapters = {
    NBA: {
        normalizePeriod: (period: number): string => {
            if (period <= 4) return `Q${period}`;
            return `OT${period - 4}`;
        },
        normalizeStatus: (status: string): GameStatus => {
            if (status.includes('Final') || status.includes('FT')) return 'FINAL';
            if (status.includes('Live') || status.includes('In Progress')) return 'LIVE';
            return 'UPCOMING';
        }
    },
    NFL: {
        normalizePeriod: (period: number): string => {
            if (period <= 4) return `Q${period}`;
            return 'OT';
        },
        normalizeStatus: (status: string): GameStatus => {
            if (status.includes('Final') || status.includes('FT')) return 'FINAL';
            if (status.includes('Live') || status.includes('In Progress')) return 'LIVE';
            return 'UPCOMING';
        }
    },
    MLS: {
        normalizePeriod: (period: number): string => {
            if (period === 1) return '1st Half';
            if (period === 2) return '2nd Half';
            return 'Extra Time';
        },
        normalizeStatus: (status: string): GameStatus => {
            if (status.includes('Final') || status.includes('FT')) return 'FINAL';
            if (status.includes('Live') || status.includes('In Progress')) return 'LIVE';
            return 'UPCOMING';
        }
    }
};

// Parse leaders data based on league
const parseLeaders = (data: any, league: string) => {
    if (!data || !data.leaders) return undefined;
    
    const leaderCategories = {
        NBA: ['points', 'rebounds', 'assists'],
        NFL: ['passingYards', 'rushingYards', 'receivingYards'],
        MLS: ['goals', 'assists']
    };
    
    const categories = leaderCategories[league as keyof typeof leaderCategories] || [];
    const leaders: any = { home: {}, away: {} };
    
    categories.forEach(category => {
        if (data.leaders.home?.[category]) {
            leaders.home[category] = {
                name: data.leaders.home[category].displayName || data.leaders.home[category].name || '—',
                photo: data.leaders.home[category].headshot?.href,
                stats: data.leaders.home[category].statistics || {}
            };
        }
        if (data.leaders.away?.[category]) {
            leaders.away[category] = {
                name: data.leaders.away[category].displayName || data.leaders.away[category].name || '—',
                photo: data.leaders.away[category].headshot?.href,
                stats: data.leaders.away[category].statistics || {}
            };
        }
    });
    
    return leaders;
};

// Parse live game data from backend response
const parseLiveGameData = (data: any, league: string): LiveGameData => {
    if (!data) {
        return { status: 'UPCOMING' };
    }

    const adapter = leagueAdapters[league as keyof typeof leagueAdapters] || leagueAdapters.NBA;
    
    // Determine status
    const statusText = data.status?.type?.name || data.status?.state || '';
    const status = adapter.normalizeStatus(statusText);
    
    // Parse score
    const competitions = data.competitions?.[0];
    const competitors = competitions?.competitors || [];
    const homeCompetitor = competitors.find((c: any) => c.homeAway === 'home');
    const awayCompetitor = competitors.find((c: any) => c.homeAway === 'away');
    
    const score = status === 'LIVE' || status === 'FINAL' ? {
        home: parseInt(homeCompetitor?.score || '0'),
        away: parseInt(awayCompetitor?.score || '0')
    } : undefined;
    
    // Parse period and clock
    const period = competitions?.status?.period || 0;
    const periodLabel = status === 'LIVE' ? adapter.normalizePeriod(period) : undefined;
    const clock = status === 'LIVE' ? competitions?.status?.displayClock : undefined;
    
    // Parse leaders
    const leaders = status === 'LIVE' ? parseLeaders(competitions, league) : undefined;
    
    return {
        status,
        periodLabel,
        clock,
        score,
        leaders
    };
};

// Mock live game data for testing
const getMockLiveData = (gameId: string, league: string): LiveGameData => {
    if (gameId !== 'mock-live-game-123') {
        return { status: 'UPCOMING' };
    }

    // Return mock live data based on league
    if (league === 'NBA') {
        return {
            status: 'LIVE',
            periodLabel: 'Q3',
            clock: '7:42',
            score: {
                home: 89,
                away: 92
            },
            leaders: {
                home: {
                    points: {
                        name: 'LeBron James',
                        photo: 'https://a.espncdn.com/i/headshots/nba/players/full/1966.png',
                        stats: { PTS: 28, REB: 7, AST: 6, FG: '10-18' }
                    },
                    rebounds: {
                        name: 'Anthony Davis',
                        photo: 'https://a.espncdn.com/i/headshots/nba/players/full/6583.png',
                        stats: { REB: 12, PTS: 18, BLK: 3, FG: '8-14' }
                    },
                    assists: {
                        name: 'D\'Angelo Russell',
                        photo: 'https://a.espncdn.com/i/headshots/nba/players/full/3136195.png',
                        stats: { AST: 8, PTS: 15, REB: 3, '3PT': '3-7' }
                    }
                },
                away: {
                    points: {
                        name: 'Jayson Tatum',
                        photo: 'https://a.espncdn.com/i/headshots/nba/players/full/4065648.png',
                        stats: { PTS: 31, REB: 8, AST: 5, FG: '11-20' }
                    },
                    rebounds: {
                        name: 'Al Horford',
                        photo: 'https://a.espncdn.com/i/headshots/nba/players/full/3213.png',
                        stats: { REB: 10, PTS: 12, BLK: 2, FG: '5-9' }
                    },
                    assists: {
                        name: 'Derrick White',
                        photo: 'https://a.espncdn.com/i/headshots/nba/players/full/2991230.png',
                        stats: { AST: 7, PTS: 14, STL: 2, '3PT': '2-5' }
                    }
                }
            }
        };
    }

    return { status: 'UPCOMING' };
};

export const useLiveGameStatus = (gameId: string | undefined, league: string) => {
    const [liveData, setLiveData] = useState<LiveGameData>({ status: 'UPCOMING' });
    const [isLoading, setIsLoading] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Don't poll if no gameId
        if (!gameId) {
            return;
        }

        // Check if this is a mock game ID and return mock data
        const isDevelopment = process.env.NODE_ENV === 'development';
        if (isDevelopment && gameId === 'mock-live-game-123') {
            setLiveData(getMockLiveData(gameId, league));
            return;
        }

        const fetchLiveData = async () => {
            try {
                setIsLoading(true);
                let response;
                
                // Fetch live game data based on league
                if (league === 'NBA') {
                    response = await sports_stats_methods.getLiveNBAGames();
                } else if (league === 'NFL') {
                    response = await sports_stats_methods.getLiveNFLGames();
                } else if (league === 'MLS') {
                    response = await sports_stats_methods.getLiveSoccerGames(['MLS']);
                } else {
                    return;
                }

                // Find the specific game in the response
                const events = response?.events || [];
                const gameData = events.find((event: any) => event.id === gameId);
                
                if (gameData) {
                    const parsedData = parseLiveGameData(gameData, league);
                    setLiveData(parsedData);
                }
            } catch (error) {
                console.error('Error fetching live game data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // Initial fetch
        fetchLiveData();

        // Set up polling interval
        intervalRef.current = setInterval(fetchLiveData, POLL_INTERVAL);

        // Cleanup
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [gameId, league]);

    return { liveData, isLoading };
};
