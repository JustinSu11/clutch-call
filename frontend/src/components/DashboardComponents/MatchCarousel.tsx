/* eslint-disable @typescript-eslint/no-explicit-any */
/* 
Author: Justin Nguyen
Last Updated: 10/08/2025 by Justin Nguyen
Purpose: Carousel for upcoming and live matches for the selected sport.
*/

'use client'
import { parseUpcomingNBAGames } from "@/utils/nba_parser"
import { parseUpcomingNFLGames } from "@/utils/nfl_parser"
import { parseUpcomingMLSGames } from "@/utils/mls_parser"
import React, { useState, useRef, useEffect } from "react"
import Slider from "react-slick"
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"
import MatchCard from "../MatchCard"
import { UpcomingGame } from "@/utils/data_class"

//returns the upcoming matches as arrays of the UpcomingMatch type
const fetchAllMatches = async (): Promise<UpcomingGame[]> => {
    const [nba, nfl, mls] = await Promise.all([
        parseUpcomingNBAGames().catch(() => []),
        parseUpcomingNFLGames().catch(() => []),
        parseUpcomingMLSGames().catch(() => [])
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalize = (arr: any[]) => (arr || []).map((game: any) => ({
        awayTeam: game.awayTeam,
        homeTeam: game.homeTeam,
        gameDate: game.gameDate instanceof Date ? game.gameDate : new Date(game.gameDate),
        dateAndTime: game.dateAndTime instanceof Date ? game.dateAndTime : new Date(game.dateAndTime),
        league: game.league
    }))

    return [...normalize(nba), ...normalize(nfl), ...normalize(mls)]
}

export default function MatchCarousel({ selectedLeagues }: { selectedLeagues: string[] }) {
    const [upcomingMatchesToday, setUpcomingMatchesToday] = useState<UpcomingGame[]>([])

    //timer to know when midnight passes
    const timerRef = useRef<number | null>(null)

    function upcomingMatchesWithinXDays(a: Date, b: Date, daysAhead = 7) {
        const diff = a.getTime() - b.getTime()
        return diff >= 0 && diff <= daysAhead * 24 * 60 * 60 * 1000
    }
    //function to re-fetch matches every night at midnight
    function scheduleMidnightRefresh(recalc: () => void) {
        if(timerRef.current) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
        }
        const now = new Date()
        const nextMidnight = new Date(now)
        nextMidnight.setDate(now.getDate()+1)
        nextMidnight.setHours(0, 0, 0, 0)
        const msUntil = nextMidnight.getTime() - now.getTime()
        //schedule first refresh at next midnight then the callback will reschedule itself
        timerRef.current = window.setTimeout(function tick() {
            recalc()
            //schedule next midnight in ~24 hours
            scheduleMidnightRefresh(recalc)
        }, msUntil)
    }
    //This fetches the matches and filters them to only keep the matches that are happening in the current day
    useEffect(() => {
        let mounted = true

        async function loadAndFilter() {
            const all = await fetchAllMatches()
            if(!mounted) {
                return
            }
            const today = new Date()
            const matchesWithinDays = all.filter((game) => upcomingMatchesWithinXDays(game.gameDate, today))

            const filteredMatches = selectedLeagues.length > 0 ? matchesWithinDays.filter((game) => selectedLeagues.includes(game.league?.toUpperCase() ?? "")) : matchesWithinDays

            setUpcomingMatchesToday(filteredMatches)
        }

        loadAndFilter()
        scheduleMidnightRefresh(() => {
            //re-run filter (if data is stable, no re-fetch; if fresh data is needed then re-fetch)
            fetchAllMatches().then((all) => {
                if(!mounted) {
                    return
                }
                const today = new Date()
                const todayMatches = all.filter((game) => upcomingMatchesWithinXDays(game.gameDate, today))
                setUpcomingMatchesToday(todayMatches)
                console.log(upcomingMatchesToday)
            })
        })

        return () => {
            mounted = false
            if(timerRef.current) {
                window.clearTimeout(timerRef.current)
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLeagues])

    const settings = {
        dots: true,
        infinite: true,
        speed: 400,
        slidesToShow: 1,
        slidesToScroll: 1,
    }
    return (
        <div className="block w-full">
            <Slider {...settings} className="!flex !items-center">
                {upcomingMatchesToday.length === 0 ? (
                    <div className="text-sm text-text-secondary">No Matches today</div>
                ) : (
                    upcomingMatchesToday.map((game) => (
                        <MatchCard key={`${game.awayTeam.displayName} versus ${game.homeTeam.displayName}`} matchDate={game.dateAndTime} awayTeam={game.awayTeam} homeTeam={game.homeTeam} league={game.league} />
                    ))
                )}
            </Slider>
        </div>
    );
}