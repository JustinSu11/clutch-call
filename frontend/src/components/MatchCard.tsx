/*
Author: Justin Nguyen
Last Updated: 10/13/2025 by Justin Nguyen
Purpose: Displays a single match card for upcoming or live games
*/
import Image from "next/image"
import "@/styles/globals.css"
import formatDate from "@/utils/date-formatter-for-matches"

type MatchCardProps = {
    awayTeam: string
    homeTeam: string
    matchDate: Date
}

export default function MatchCard({ awayTeam, homeTeam, matchDate }: MatchCardProps) {
    const calculateTimeLeft = () => {
        const now = new Date()
        const diff = matchDate.getTime() - now.getTime()
        if(diff <= 0) {
            return "Game in progress"
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((diff / (1000 * 60)) % 60)
        return `${days}d ${hours}h ${minutes}m`
    }

    const timeLeft = calculateTimeLeft()

    return (
        <div className="flex items-center justify-center p-4">
            <div className="relative w-full rounded-xl overflow-hidden shadow-lg group">
                {/*Background image*/}
                <div className="absolute inset-0 bg-center bg-cover" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAwR5oTbhPonHKnDQo8cpHRl9bPTIaQp_QST7ln7G1cl_Mq0bzCrvkT3HFUmZ0qEyEHEVjDuaJxeTHRozIMAZaiHRWMKrrwVkIFekjNhJepLEf3ig1EEnBCFjZ46ylVRS2OJDDyd4OhVcp3B3WmuhE4tsof5TpnLE1sW5M-ZraMjO44krCGl94fuq9FjrYG94twy-sslQhMisgaqZGMoi0qNloCor1tstwBwYXvXHYsyM2oPaunyZdxBeHu_iZjqzrjQHHIE7cdMzqW')"}} />
                {/*Team gradient and vignette overlays */}
                <div className="team-gradient-overlay vignette-overlay absolute inset-0" />
                <div className="relative p-6 sm:p-8 text-text-primary">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="flex items-center justify-around w-full mb-6">
                            {/*Away team*/}
                            <div className="flex flex-col items-center gap-3 w-1/3">
                                <Image src="https://upload.wikimedia.org/wikipedia/en/6/6b/New_York_Jets_logo.svg" alt={`${awayTeam} Logo`} className="h-16 w-16 sm:h-24 sm:w-24 object-contain" width={96} height={96}/>
                                <span className="font-bold text-lg sm:text-xl tracking-tight">{awayTeam}</span>
                            </div>

                            <div className="font-black text-2xl sm:text-4xl text-text-primary">VS.</div>

                            {/*Home team*/}
                            <div className="flex flex-col items-center gap-3 w-1/3">
                                <Image src="https://upload.wikimedia.org/wikipedia/en/6/6b/New_York_Jets_logo.svg" alt={`${homeTeam} Logo`} className="h-16 w-16 sm:h-24 sm:w-24 object-contain" width={96} height={96}/>
                                <span className="font-bold text-lg sm:text-xl tracking-tight">{homeTeam}</span>
                            </div>
                        </div>
                        {/*Match time and countdown*/}
                        <div className="flex flex-col items-center gap-1">
                            <p className="text-lg font-semibold text-text-primary">{formatDate(matchDate)}</p>
                            <p className="text-sm font-medium text-text-secondary">{timeLeft}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}