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

type UpcomingMatch = {
    away: string
    home: string
    date: Date
}

//returns the upcoming matches as arrays of the UpcomingMatch type
const fetchAllMatches = async (): Promise<UpcomingMatch[]> => {
    const [nba, nfl, mls] = await Promise.all([
        parseUpcomingNBAGames().catch(() => []),
        parseUpcomingNFLGames().catch(() => []),
        parseUpcomingMLSGames().catch(() => [])
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalize = (arr: any[]) => (arr || []).map((match: any) => ({
        away: match.awayTeam,
        home: match.homeTeam,
        date: new Date(match.date)
    }))

    return [...normalize(nba), ...normalize(nfl), ...normalize(mls)]
}



export default function MatchCarousel() {
    const [upcomingMatchesToday, setUpcomingMatchesToday] = useState<UpcomingMatch[]>([])

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
            const todayMatches = all.filter((match) => upcomingMatchesWithinXDays(match.date, today))
            setUpcomingMatchesToday(todayMatches)
        }

        loadAndFilter()
        scheduleMidnightRefresh(() => {
            //re-run filter (if data is stable, no re-fetch; if fresh data is needed then re-fetch)
            fetchAllMatches().then((all) => {
                if(!mounted) {
                    return
                }
                const today = new Date()
                const todayMatches = all.filter((match) => upcomingMatchesWithinXDays(match.date, today))
                setUpcomingMatchesToday(todayMatches)
            })
        })

        return () => {
            mounted = false
            if(timerRef.current) {
                window.clearTimeout(timerRef.current)
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const settings = {
        dots: true,
        infinite: true,
        speed: 400,
        slidesToShow: 1,
        slidesToScroll: 1,
    }

    return (
        <div className="block w-full">
            <Slider {...settings}>
                {upcomingMatchesToday.length === 0 ? (
                    <div className="text-sm text-text-secondary">No Matches today</div>
                ) : (
                    upcomingMatchesToday.map((match) => (
                        
                        <MatchCard key={`${match.away}versus${match.home}`} matchDate={match.date} awayTeam={match.away} homeTeam={match.home}/>
                    ))
                )}
            </Slider>
        </div>
    );
}