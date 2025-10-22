/* 
Author: Justin Nguyen
Last Updated: 10/08/2025 by Justin Nguyen
Purpose: Formats the input date and time of a match into a more appealing date format.
*/

//return new formatted date after checking if input is valid
export default function formatDate(input: string | Date): string {
    const d = typeof input === "string" ? new Date(input) : input
    if (Number.isNaN(d.getTime())) return ""
    const month = d.toLocaleString(undefined, { month: "short" })
    const day = d.toLocaleString(undefined, { day: "2-digit"})
    const time = d.toLocaleString(undefined, { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase().replace(" ", "")
    return `${month}-${day} @ ${time}`
    //example return: Oct-10 @ 7:00pm
}   