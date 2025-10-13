/*
    A dialog component to display match stuff when clicking on a
    match in the predictions page
    Made: 10/09/2025 by CJ
    Last Updated: 10/13/2025 by CJ

*/

"use client";
import React from "react";

export type TeamStats = {
    wins: number;
    losses: number;
    ties: number;
    totalGames: number;
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
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* dimmed background */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            {/* dialog box */}
            <div className="relative bg-dialog-bg rounded-lg shadow-xl max-w-5xl w-full mx-4 p-6">
                <div className="mb-8 relative">
                    {/* dialog header */}
                    <h3 className="flex items-center justify-center text-2xl font-bold text-text-primary gap-4">
                        <div className="flex items-center gap-3">
                            {awayLogo ? (
                                <img src={awayLogo} alt={`${awayTeam} logo`} className="w-30 h-30 object-contain" />
                            ) : null}
                            <span className="text-3xl font-semibold">{awayTeam}</span>
                        </div>

                        <span className="text-3xl font-semibold">at</span>

                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-semibold">{homeTeam}</span>
                            {homeLogo ? (
                                <img src={homeLogo} alt={`${homeTeam} logo`} className="w-30 h-30 object-contain" />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* left column with right border (the divider) */}
                        <div className="text-text-primary space-y-2 border-r-2 pr-4 flex flex-col">
                            <div className="flex items-center gap-3">
                                <h4 className="text-text-primary text-xl font-semibold">{awayTeam}</h4>
                            </div>
                            {awayStats ? (
                                <ul className="text-xl space-y-1">
                                    {Object.entries(awayStats).map(([k, v]) => (
                                        <li key={k} className="flex justify-between">
                                            <span className="text-text-primary text-lg">{k}</span>
                                            <span className="text-text-primary text-lg">{String(v)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-2xl text-text-primary">No stats available</div>
                            )}
                        </div>

                        <div className="space-y-2 pl-4 flex flex-col">
                            {/* right column with left padding */}
                            <div className="flex items-center gap-3">
                                <h4 className="text-text-primary text-xl font-semibold">{homeTeam}</h4>
                            </div>
                            {homeStats ? (
                                <ul className="text-xl space-y-1">
                                    {Object.entries(homeStats).map(([k, v]) => (
                                        <li key={k} className="flex justify-between">
                                            <span className="text-text-primary text-lg">{k}</span>
                                            <span className="text-text-primary text-lg">{String(v)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-2xl text-text-primary">No stats available</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}