/* 
Author: Justin Nguyen
Last Updated: 10/08/2025 by Justin Nguyen
Purpose: Formats the input date and time of a match into a more appealing date format.
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