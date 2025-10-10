/* 
Author: Justin Nguyen
Last Updated: 10/08/2025 by Justin Nguyen
Purpose: Carousel for upcoming and live matches for the selected sport.
*/

import { parseUpcomingNBAGames } from "@/utils/nba_parser"
import { parseUpcomingNFLGames } from "@/utils/nfl_parser"
import { parseUpcomingMLSGames } from "@/utils/mls_parser"

type UpcomingMatch = {
    away: string
    home: string
    date: Date
}

const getUpcomingNFLGames = async (): Promise<UpcomingMatch[]> => {
    const upcomingNFLGames = await parseUpcomingNFLGames()

    return upcomingNFLGames.map((match) => ({
        away: match.awayTeam,
        home: match.homeTeam,
        date: match.date
    }))
}



export default function MatchCarousel() {

}