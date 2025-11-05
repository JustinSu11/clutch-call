/*
    File: src/components/LiveGamePanel.tsx
    Created: 2025-11-05
    
    Description: Expandable panel that shows live game details including score, period/clock, and leaders carousel
*/

'use client'

import React from 'react';
import { LiveGameData } from '@/utils/data_class';
import { 
    Carousel, 
    CarouselContent, 
    CarouselItem, 
    CarouselNext, 
    CarouselPrevious 
} from '@/components/ui/carousel';

type LiveGamePanelProps = {
    liveData: LiveGameData;
    homeTeamName: string;
    awayTeamName: string;
    league: string;
};

// Get leader categories for each league
const getLeaderCategories = (league: string) => {
    const categories = {
        NBA: [
            { key: 'points', label: 'Points', stat: 'PTS' },
            { key: 'rebounds', label: 'Rebounds', stat: 'REB' },
            { key: 'assists', label: 'Assists', stat: 'AST' }
        ],
        NFL: [
            { key: 'passingYards', label: 'Passing Yds', stat: 'YDS' },
            { key: 'rushingYards', label: 'Rushing Yds', stat: 'YDS' },
            { key: 'receivingYards', label: 'Receiving Yds', stat: 'YDS' }
        ],
        MLS: [
            { key: 'goals', label: 'Goals', stat: 'G' },
            { key: 'assists', label: 'Assists', stat: 'A' }
        ]
    };
    return categories[league as keyof typeof categories] || categories.NBA;
};

export default function LiveGamePanel({ 
    liveData, 
    homeTeamName, 
    awayTeamName, 
    league 
}: LiveGamePanelProps) {
    const categories = getLeaderCategories(league);

    return (
        <div className="bg-black/70 backdrop-blur-sm p-4 space-y-4">
            {/* Header: LIVE Badge, Score, Period/Clock */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                        LIVE
                    </span>
                    {liveData.periodLabel && (
                        <span className="text-white font-semibold text-lg">
                            {liveData.periodLabel}
                        </span>
                    )}
                    {liveData.clock && (
                        <span className="text-white/80 text-sm">
                            {liveData.clock}
                        </span>
                    )}
                </div>
                {liveData.score && (
                    <div className="flex items-center gap-4 text-white">
                        <div className="text-center">
                            <div className="text-xs text-white/60 mb-1">{awayTeamName}</div>
                            <div className="text-2xl font-bold">{liveData.score.away}</div>
                        </div>
                        <span className="text-white/60">—</span>
                        <div className="text-center">
                            <div className="text-xs text-white/60 mb-1">{homeTeamName}</div>
                            <div className="text-2xl font-bold">{liveData.score.home}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Leaders Carousel */}
            {liveData.leaders && (
                <div className="relative">
                    <h3 className="text-white font-semibold mb-3 text-center">Game Leaders</h3>
                    <Carousel opts={{ align: 'start', loop: false }} className="w-full">
                        <CarouselContent>
                            {categories.map((category) => {
                                const homeLeader = liveData.leaders?.home?.[category.key];
                                const awayLeader = liveData.leaders?.away?.[category.key];
                                
                                if (!homeLeader && !awayLeader) return null;

                                return (
                                    <CarouselItem key={category.key} className="md:basis-1/2 lg:basis-1/2">
                                        <div className="p-2">
                                            <div className="text-white text-center font-semibold mb-3 text-sm">
                                                {category.label}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Home Leader - Photo Left, Stats Right */}
                                                <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3">
                                                    {homeLeader?.photo ? (
                                                        <img 
                                                            src={homeLeader.photo} 
                                                            alt={homeLeader.name}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                                            <span className="text-white text-xs">?</span>
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-white text-xs font-semibold truncate">
                                                            {homeLeader?.name || '—'}
                                                        </div>
                                                        <div className="text-white/80 text-lg font-bold">
                                                            {homeLeader?.stats?.[category.stat] || '—'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Away Leader - Stats Left, Photo Right */}
                                                <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3 flex-row-reverse">
                                                    {awayLeader?.photo ? (
                                                        <img 
                                                            src={awayLeader.photo} 
                                                            alt={awayLeader.name}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                                            <span className="text-white text-xs">?</span>
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0 text-right">
                                                        <div className="text-white text-xs font-semibold truncate">
                                                            {awayLeader?.name || '—'}
                                                        </div>
                                                        <div className="text-white/80 text-lg font-bold">
                                                            {awayLeader?.stats?.[category.stat] || '—'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CarouselItem>
                                );
                            })}
                        </CarouselContent>
                        {categories.length > 2 && (
                            <>
                                <CarouselPrevious className="left-2" />
                                <CarouselNext className="right-2" />
                            </>
                        )}
                    </Carousel>
                </div>
            )}
        </div>
    );
}
