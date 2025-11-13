/*
    A dialog component to display match stuff when clicking on a
    match in the predictions page
    Made: 10/09/2025 by CJ
    Last Updated: 10/28/2025 by CJ

*/

"use client";
import React from "react";

export type TeamStats = {
    wins: number;
    losses: number;
    ties: number;
    totalGames: number;
};

export type DecisionFactor = {
    factor: string;
    importance: number;
    value: number;
    contribution: number;
    impact?: number;
    effect?: string;
    delta?: number;
};

const formatFactorValue = (factor: DecisionFactor): string => {
    // Format the actual value of the factor for display
    const value = factor.value;
    const factorName = factor.factor.toLowerCase();
    
    // For percentage-based stats
    if (factorName.includes('percentage') || factorName.includes('win rate') || factorName.includes('%')) {
        return `${(value * 100).toFixed(1)}%`;
    }
    
    // For ratings and pace (typically 90-120 range)
    if (factorName.includes('rating') || factorName.includes('pace')) {
        return value.toFixed(1);
    }
    
    // For streak (show with + or -)
    if (factorName.includes('streak')) {
        const streakValue = Math.round(value);
        return streakValue >= 0 ? `+${streakValue}` : `${streakValue}`;
    }
    
    // For rest days
    if (factorName.includes('rest') || factorName.includes('days')) {
        return `${Math.round(value)} days`;
    }
    
    // For points per game
    if (factorName.includes('points') || factorName.includes('ppg')) {
        return `${value.toFixed(1)} pts`;
    }
    
    // For home court advantage (binary 0 or 1)
    if (factorName.includes('home court')) {
        return value === 1 ? 'Home' : 'Away';
    }
    
    // Default: show as decimal with 1 decimal place
    return value.toFixed(1);
};

export default function MatchDialog({
    open,
    onClose,
    homeTeam,
    awayTeam,
    homeStats,
    awayStats,
    loading,
    homeLogo,
    awayLogo,
    decisionFactors,
    prediction,
    confidence,
}: {
    open: boolean;
    onClose: () => void;
    homeTeam?: string;
    awayTeam?: string;
    homeStats?: TeamStats | null;
    awayStats?: TeamStats | null;
    loading?: boolean;
    homeLogo?: string;
    awayLogo?: string;
    decisionFactors?: DecisionFactor[];
    prediction?: string;
    confidence?: number;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* dimmed background */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            {/* dialog box */}
            <div className="relative bg-dialog-bg rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="mb-6 relative">
                    {/* dialog header */}
                    <h3 className="flex items-center justify-center text-xl font-bold text-text-primary gap-3">
                        <div className="flex items-center gap-2">
                            {awayLogo ? (
                                <img src={awayLogo} alt={`${awayTeam} logo`} className="w-8 h-8 object-contain" />
                            ) : null}
                            <span className="text-2xl font-semibold">{awayTeam}</span>
                        </div>

                        <span className="text-2xl font-semibold">at</span>

                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-semibold">{homeTeam}</span>
                            {homeLogo ? (
                                <img src={homeLogo} alt={`${homeTeam} logo`} className="w-8 h-8 object-contain" />
                            ) : null}
                        </div>
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute right-2 top-2 text-2xl font-bold text-text-primary rounded hover:text-primary cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {loading ? (
                    <div className="py-8 text-center text-text-primary text-2xl">Loading...</div>
                ) : (
                    <>
                        {/* Prediction and Confidence */}
                        {prediction && confidence !== undefined && (
                            <div className="mb-4 p-3 bg-secondary rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-base font-semibold text-text-primary">{prediction}</span>
                                    <span className="text-base font-bold text-primary">{Math.round(confidence)}% Confidence</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full transition-all"
                                        style={{
                                            width: `${confidence}%`,
                                            backgroundColor: `hsl(${(confidence / 100) * 100}, 90%, 45%)`
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* left column with right border (the divider) */}
                            <div className="text-text-primary space-y-2 border-r-2 pr-4 flex flex-col">
                                <div className="flex items-center gap-3">
                                    <h4 className="text-text-primary text-lg font-semibold">{awayTeam}</h4>
                                </div>
                                {awayStats ? (
                                    <ul className="text-base space-y-1">
                                        {Object.entries(awayStats).map(([k, v]) => (
                                            <li key={k} className="flex justify-between">
                                                <span className="text-text-primary text-sm">{k}</span>
                                                <span className="text-text-primary text-sm">{String(v)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-base text-text-primary">No stats available</div>
                                )}
                            </div>

                            <div className="space-y-2 pl-4 flex flex-col">
                                {/* right column with left padding */}
                                <div className="flex items-center gap-3">
                                    <h4 className="text-text-primary text-lg font-semibold">{homeTeam}</h4>
                                </div>
                                {homeStats ? (
                                    <ul className="text-base space-y-1">
                                        {Object.entries(homeStats).map(([k, v]) => (
                                            <li key={k} className="flex justify-between">
                                                <span className="text-text-primary text-sm">{k}</span>
                                                <span className="text-text-primary text-sm">{String(v)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-base text-text-primary">No stats available</div>
                                )}
                            </div>
                        </div>

                        {/* Decision Factors Section */}
                        {decisionFactors && decisionFactors.length > 0 && (
                            <div className="mt-4 pt-4 border-t-2 border-secondary">
                                <h4 className="text-lg font-bold text-text-primary mb-3">Decision Factors</h4>
                                <div className="space-y-3">
                                    {decisionFactors.map((factor, idx) => (
                                        <div key={idx} className="bg-secondary p-3 rounded-lg">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-semibold text-text-primary">
                                                    {factor.factor}
                                                </span>
                                                <span className="text-sm font-bold text-primary">
                                                    {(factor.contribution * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                                                <div>
                                                    <span className="font-medium">Value: </span>
                                                    {formatFactorValue(factor)}
                                                </div>
                                                {factor.effect && (
                                                    <div>
                                                        <span className="font-medium">Effect: </span>
                                                        {factor.effect}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className="h-1.5 rounded-full bg-primary"
                                                    style={{ width: `${factor.contribution * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}