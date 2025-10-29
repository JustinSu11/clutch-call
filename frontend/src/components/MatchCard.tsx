/* eslint-disable @typescript-eslint/no-explicit-any */
/*
Author: Justin Nguyen
Last Updated: 10/18/2025 by Justin Nguyen
Purpose: Displays a single match card for upcoming or live games with improved balance and contrast
*/
import "@/styles/globals.css"
import formatDate from "@/utils/date-formatter-for-matches"
import { Team } from "@/utils/data_class"
import createTeamLogo from "@/utils/create-team-logo"

type MatchCardProps = {
  awayTeam: Team
  homeTeam: Team
  matchDate: Date
}

export default function MatchCard({ awayTeam, homeTeam, matchDate }: MatchCardProps) {
  const calculateTimeLeft = () => {
    const now = new Date()
    const diff = matchDate.getTime() - now.getTime()
    if (diff <= 0) return "Game in progress"
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((diff / (1000 * 60)) % 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const timeLeft = calculateTimeLeft()
  const awayTeamLogo = createTeamLogo(awayTeam)
  const homeTeamLogo = createTeamLogo(homeTeam)

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
          style={{
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAwR5oTbhPonHKnDQo8cpHRl9bPTIaQp_QST7ln7G1cl_Mq0bzCrvkT3HFUmZ0qEyEHEVjDuaJxeTHRozIMAZaiHRWMKrrwVkIFekjNhJepLEf3ig1EEnBCFjZ46ylVRS2OJDDyd4OhVcp3B3WmuhE4tsof5TpnLE1sW5M-ZraMjO44krCGl94fuq9FjrYG94twy-sslQhMisgaqZGMoi0qNloCor1tstwBwYXvXHYsyM2oPaunyZdxBeHu_iZjqzrjQHHIE7cdMzqW')",
          }}
        />

        {/* Gradient & vignette overlays */}
        <div className="team-gradient-overlay vignette-overlay absolute inset-0" />
        <div className="absolute inset-0 bg-black/50" />

        {/* Content */}
        <div className="relative p-8 text-white">
          <div className="grid grid-cols-3 grid-rows-[auto_auto] justify-items-center text-center gap-y-4 w-full">
            {/* Row 1 — Logos + VS */}
            <div className="row-start-1 col-start-1 flex items-center justify-center h-28">
              {awayTeamLogo}
            </div>

            <div className="row-start-1 col-start-2 flex flex-col items-center justify-center">
              <span className="font-extrabold text-3xl sm:text-5xl text-white drop-shadow-lg">
                VS
              </span>
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
              <p className="text-base font-semibold text-white">
                {formatDate(matchDate)}
              </p>
              <p className="text-sm font-medium text-white/80">{timeLeft}</p>
            </div>

            <div className="row-start-2 col-start-3">
              <span className="font-semibold text-lg sm:text-xl tracking-tight text-white/90">
                {homeTeam.displayName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
