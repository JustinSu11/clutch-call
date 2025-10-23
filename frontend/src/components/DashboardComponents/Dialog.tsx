/*
    A dialog component to display match stuff when clicking on a
    match in the predictions page
    Made: 10/09/2025 by CJ
    Last Updated: 10/09/2025 by CJ

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
}: {
    open: boolean;
    onClose: () => void;
    homeTeam?: string;
    awayTeam?: string;
    homeStats?: TeamStats | null;
    awayStats?: TeamStats | null;
    loading?: boolean;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* dimmed background */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            {/* dialog box */}
            <div className="relative bg-dialog-bg rounded-lg shadow-xl max-w-3xl w-full mx-4 p-6">
                <div className="mb-8">
                    {/* dialog header */}
                    <h3 className="flex items-center justify-center text-2xl font-bold text-text-primary">
                        {awayTeam} at {homeTeam}
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute right-4 top-3 text-1xl font-bold text-text-primary rounded hover:text-primary cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {loading ? (
                    <div className="py-8 text-center text-text-primary text-2xl">Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* left column with right border (the divider) */}
                        <div className="text-text-primary space-y-2 border-r-2 pr-4">
                            <h4 className="text-text-primary text-lg font-semibold">{awayTeam}</h4>
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

                        <div className="space-y-2 pl-4">
                            {/* right column with left padding */}
                            <h4 className="text-text-primary text-lg font-semibold">{homeTeam}</h4>
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