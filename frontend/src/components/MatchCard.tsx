/* eslint-disable @typescript-eslint/no-explicit-any */
/*
Author: Justin Nguyen
Last Updated: 11/05/2025 by GitHub Copilot
Purpose: Displays a single match card for upcoming or live games with improved balance and contrast.
         Live games can be expanded to show score, period/clock, and leaders carousel.
*/
'use client'

import "@/styles/globals.css"
import formatDate from "@/utils/date-formatter-for-matches"
import { Team } from "@/utils/data_class"
import createTeamLogo from "@/utils/create-team-logo"
import { useLiveGameStatus } from "@/hooks/use-live-game-status"
import LiveGamePanel from "./LiveGamePanel"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

type MatchCardProps = {
  awayTeam: Team
  homeTeam: Team
  matchDate: Date
  league: string
  gameId?: string
  isExpanded?: boolean
  onExpand?: (gameId: string | undefined) => void
}

export default function MatchCard({ awayTeam, homeTeam, matchDate, league, gameId, isExpanded: externalIsExpanded, onExpand }: MatchCardProps) {
    const [internalIsExpanded, setInternalIsExpanded] = useState(false)
    const { liveData } = useLiveGameStatus(gameId, league)
    
    // Use external state if provided, otherwise use internal state
    const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded
    
    const calculateTimeLeft = () => {
        const now = new Date()
        const diff = matchDate.getTime() - now.getTime()
        if (diff <= 0) return "Game in progress"
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((diff / (1000 * 60)) % 60)
        return `${days}d ${hours}h ${minutes}m`
    }

    const handleToggleExpand = () => {
        if (onExpand) {
            // Notify parent component
            onExpand(isExpanded ? undefined : gameId)
        } else {
            // Fall back to internal state if no callback provided
            setInternalIsExpanded(!internalIsExpanded)
        }
    }

    const timeLeft = calculateTimeLeft()
    const awayTeamLogo = createTeamLogo(awayTeam)
    const homeTeamLogo = createTeamLogo(homeTeam)
    const isLive = liveData.status === 'LIVE'

    return (
        <div className="flex items-center justify-center p-4">
        <div
            className="relative w-full rounded-lg overflow-hidden group"
            style={{
            ['--away-team-color' as any]: `#${awayTeam.color}`,
            ['--home-team-color' as any]: `#${homeTeam.color}`,
            }}
        >
            {/* Background image */}
            <div
            className="absolute inset-0 bg-center bg-cover"
            style={{backgroundImage: league === "NBA" ? "url('/BasketballMatchCardBackground.png')" : league === "NFL" ? "url('/FootballMatchCardBackground.png')" : "url('/SoccerMatchCardBackground.png')", }}
            />

            {/* Gradient & vignette overlays */}
            <div className="team-gradient-overlay vignette-overlay absolute inset-0" />
            <div className="absolute inset-0 bg-black/50" />

            {/* Content */}
            <div className="relative text-white">
            <div className="p-8">
            <div className="grid grid-cols-3 grid-rows-[auto_auto] justify-items-center text-center gap-y-4 w-full">
                {/* Row 1 — Logos + VS/Score */}
                <div className="row-start-1 col-start-1 flex items-center justify-center h-28">
                {awayTeamLogo}
                </div>

                <div className="row-start-1 col-start-2 flex items-center justify-center gap-3">
                {isLive && liveData.score ? (
                    <>
                    <div className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                        {liveData.score.away}
                    </div>
                    <span className="font-extrabold text-2xl sm:text-3xl text-white/80 drop-shadow-lg">
                        VS
                    </span>
                    <div className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                        {liveData.score.home}
                    </div>
                    </>
                ) : (
                    <span className="font-extrabold text-3xl sm:text-5xl text-white drop-shadow-lg">
                        VS
                    </span>
                )}
                </div>

                <div className="row-start-1 col-start-3 flex items-center justify-center h-28">
                {homeTeamLogo}
                </div>

                {/* Row 2 — Names + Date */}
                <div className="row-start-2 col-start-1">
                <span className="font-semibold text-lg sm:text-xl tracking-tight text-white/90">
                    {awayTeam.displayName}
                </span>
                </div>

                <div className="row-start-2 col-start-2 flex flex-col items-center gap-1">
                {isLive && liveData.periodLabel ? (
                    <>
                    <div className="flex items-center gap-2">
                        <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                            LIVE
                        </span>
                        <span className="text-base font-semibold text-white">
                            {liveData.periodLabel}
                        </span>
                    </div>
                    {liveData.clock && (
                        <p className="text-sm font-medium text-white/80">{liveData.clock}</p>
                    )}
                    </>
                ) : (
                    <>
                    <p className="text-base font-semibold text-white">
                        {formatDate(matchDate)}
                    </p>
                    <p className="text-sm font-medium text-white/80">{timeLeft}</p>
                    </>
                )}
                </div>

                <div className="row-start-2 col-start-3">
                <span className="font-semibold text-lg sm:text-xl tracking-tight text-white/90">
                    {homeTeam.displayName}
                </span>
                </div>
            </div>
            </div>

            {/* Expand/Collapse Button - Only shown for LIVE games */}
            {isLive && (
                <button
                    onClick={handleToggleExpand}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "Collapse live game details" : "Expand live game details"}
                    className="w-full flex items-center justify-center py-2 hover:bg-white/10 transition-colors focus:outline-none"
                >
                    <ChevronDown 
                        className={`w-6 h-6 text-white transition-transform duration-300 motion-reduce:transition-none ${isExpanded ? 'rotate-180' : ''}`}
                    />
                </button>
            )}

            {/* Expandable Panel - Only shown for LIVE games when expanded */}
            {isLive && (
                <div 
                    className={`overflow-hidden transition-all duration-500 ease-in-out motion-reduce:transition-none ${
                        isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <LiveGamePanel 
                        liveData={liveData}
                        homeTeamName={homeTeam.displayName}
                        awayTeamName={awayTeam.displayName}
                        league={league}
                    />
                </div>
            )}
            </div>
        </div>
        </div>
    )
}
