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
    teamName: string;
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
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">
                        {awayTeam} at {homeTeam}
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="px-2 py-1 rounded hover:bg-gray-100"
                    >
                        ✕
                    </button>
                </div>

                {loading ? (
                    <div className="py-8 text-center">Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 border-r pr-4">
                            <h4 className="font-semibold">{awayTeam}</h4>
                            {awayStats ? (
                                <ul className="text-sm space-y-1">
                                    {Object.entries(awayStats).map(([k, v]) => (
                                        <li key={k} className="flex justify-between">
                                            <span className="text-gray-600">{k}</span>
                                            <span className="font-medium">{String(v)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-sm text-gray-500">No stats available</div>
                            )}
                        </div>

                        <div className="space-y-2 pl-4">
                            <h4 className="font-semibold">{homeTeam}</h4>
                            {homeStats ? (
                                <ul className="text-sm space-y-1">
                                    {Object.entries(homeStats).map(([k, v]) => (
                                        <li key={k} className="flex justify-between">
                                            <span className="text-gray-600">{k}</span>
                                            <span className="font-medium">{String(v)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-sm text-gray-500">No stats available</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}