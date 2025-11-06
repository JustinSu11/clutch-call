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
            {/* Header: LIVE Badge, Period/Clock */}
            <div className="flex items-center justify-center gap-3">
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

            {/* Leaders Carousel - One slide per category */}
            {liveData.leaders && (
                <div className="relative">
                    <Carousel opts={{ align: 'center', loop: false }} className="w-full">
                        <CarouselContent>
                            {categories.map((category) => {
                                const homeLeader = liveData.leaders?.home?.[category.key];
                                const awayLeader = liveData.leaders?.away?.[category.key];
                                
                                if (!homeLeader && !awayLeader) return null;

                                return (
                                    <CarouselItem key={category.key} className="basis-full">
                                        <div className="p-4">
                                            <div className="text-white text-center font-bold mb-4 text-lg">
                                                {category.label}
                                            </div>
                                            <div className="flex items-start justify-between gap-8">
                                                {/* Home Leader - Photo Left, Stats Right (Inside) */}
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className="flex-shrink-0">
                                                        {homeLeader?.photo ? (
                                                            <img 
                                                                src={homeLeader.photo} 
                                                                alt={homeLeader.name}
                                                                className="w-24 h-24 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                                                                <span className="text-white text-sm">?</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <div className="text-white text-sm font-semibold">
                                                            {homeLeader?.name || '—'}
                                                        </div>
                                                        <div className="text-white/80 text-xs">
                                                            {homeTeamName}
                                                        </div>
                                                        <div className="mt-2 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-white/60 text-xs">{category.stat}</span>
                                                                <span className="text-white text-2xl font-bold">
                                                                    {homeLeader?.stats?.[category.stat] || '—'}
                                                                </span>
                                                            </div>
                                                            {/* Additional stats */}
                                                            {Object.entries(homeLeader?.stats || {})
                                                                .filter(([key]) => key !== category.stat)
                                                                .slice(0, 2)
                                                                .map(([key, value]) => (
                                                                    <div key={key} className="flex items-center gap-2 text-xs">
                                                                        <span className="text-white/60">{key}</span>
                                                                        <span className="text-white/80">{value}</span>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Away Leader - Photo Right, Stats Left (Inside) */}
                                                <div className="flex items-start gap-3 flex-1 flex-row-reverse">
                                                    <div className="flex-shrink-0">
                                                        {awayLeader?.photo ? (
                                                            <img 
                                                                src={awayLeader.photo} 
                                                                alt={awayLeader.name}
                                                                className="w-24 h-24 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                                                                <span className="text-white text-sm">?</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1 min-w-0 text-right">
                                                        <div className="text-white text-sm font-semibold">
                                                            {awayLeader?.name || '—'}
                                                        </div>
                                                        <div className="text-white/80 text-xs">
                                                            {awayTeamName}
                                                        </div>
                                                        <div className="mt-2 space-y-1">
                                                            <div className="flex items-center gap-2 justify-end">
                                                                <span className="text-white text-2xl font-bold">
                                                                    {awayLeader?.stats?.[category.stat] || '—'}
                                                                </span>
                                                                <span className="text-white/60 text-xs">{category.stat}</span>
                                                            </div>
                                                            {/* Additional stats */}
                                                            {Object.entries(awayLeader?.stats || {})
                                                                .filter(([key]) => key !== category.stat)
                                                                .slice(0, 2)
                                                                .map(([key, value]) => (
                                                                    <div key={key} className="flex items-center gap-2 justify-end text-xs">
                                                                        <span className="text-white/80">{value}</span>
                                                                        <span className="text-white/60">{key}</span>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CarouselItem>
                                );
                            })}
                        </CarouselContent>
                        {categories.length > 1 && (
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
