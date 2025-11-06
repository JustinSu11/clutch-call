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
    useCarousel 
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

// Component for clickable edge navigation areas
const EdgeNavigationAreas = ({ categories }: { categories: Array<{ key: string; label: string; stat: string }> }) => {
    const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel();

    if (categories.length <= 1) return null;

    return (
        <>
            {/* Left edge clickable area */}
            {canScrollPrev && (
                <button
                    onClick={scrollPrev}
                    className="absolute left-0 top-0 bottom-0 w-16 z-10 cursor-pointer hover:bg-white/5 transition-colors"
                    aria-label="Previous slide"
                >
                    <span className="sr-only">Previous slide</span>
                </button>
            )}
            
            {/* Right edge clickable area */}
            {canScrollNext && (
                <button
                    onClick={scrollNext}
                    className="absolute right-0 top-0 bottom-0 w-16 z-10 cursor-pointer hover:bg-white/5 transition-colors"
                    aria-label="Next slide"
                >
                    <span className="sr-only">Next slide</span>
                </button>
            )}
        </>
    );
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
                                            <div className="text-white text-center font-bold mb-6 text-2xl">
                                                {category.label}
                                            </div>
                                            <div className="flex items-start justify-between gap-8">
                                                {/* Home Leader - Photo Left, Stats Right (Inside) */}
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className="flex-shrink-0">
                                                        {awayLeader?.photo ? (
                                                            <img 
                                                                src={awayLeader.photo} 
                                                                alt={awayLeader.name}
                                                                className="w-32 h-32 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center">
                                                                <span className="text-white text-lg">?</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <div className="text-white text-base font-semibold">
                                                            {awayLeader?.name || '—'}
                                                        </div>
                                                        <div className="text-white/80 text-sm">
                                                            {awayTeamName}
                                                        </div>
                                                        <div className="mt-3 space-y-2">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-white/60 text-sm">{category.stat}</span>
                                                                <span className="text-white text-4xl font-bold">
                                                                    {awayLeader?.stats?.[category.stat] || '—'}
                                                                </span>
                                                            </div>
                                                            {/* Additional stats */}
                                                            {Object.entries(awayLeader?.stats || {})
                                                                .filter(([key]) => key !== category.stat)
                                                                .slice(0, 2)
                                                                .map(([key, value]) => (
                                                                    <div key={key} className="flex items-center gap-2 text-sm">
                                                                        <span className="text-white/60">{key}</span>
                                                                        <span className="text-white/80 font-medium">{value}</span>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Away Leader - Photo Right, Stats Left (Inside) */}
                                                <div className="flex items-start gap-4 flex-1 flex-row-reverse">
                                                    <div className="flex-shrink-0">
                                                        {homeLeader?.photo ? (
                                                            <img 
                                                                src={homeLeader.photo} 
                                                                alt={homeLeader.name}
                                                                className="w-32 h-32 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center">
                                                                <span className="text-white text-lg">?</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1 min-w-0 text-right">
                                                        <div className="text-white text-base font-semibold">
                                                            {homeLeader?.name || '—'}
                                                        </div>
                                                        <div className="text-white/80 text-sm">
                                                            {homeTeamName}
                                                        </div>
                                                        <div className="mt-3 space-y-2">
                                                            <div className="flex items-center gap-3 justify-end">
                                                                <span className="text-white text-4xl font-bold">
                                                                    {homeLeader?.stats?.[category.stat] || '—'}
                                                                </span>
                                                                <span className="text-white/60 text-sm">{category.stat}</span>
                                                            </div>
                                                            {/* Additional stats */}
                                                            {Object.entries(homeLeader?.stats || {})
                                                                .filter(([key]) => key !== category.stat)
                                                                .slice(0, 2)
                                                                .map(([key, value]) => (
                                                                    <div key={key} className="flex items-center gap-2 justify-end text-sm">
                                                                        <span className="text-white/80 font-medium">{value}</span>
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
                        {/* Clickable edge areas for navigation */}
                        <EdgeNavigationAreas categories={categories} />
                    </Carousel>
                </div>
            )}
        </div>
    );
}
