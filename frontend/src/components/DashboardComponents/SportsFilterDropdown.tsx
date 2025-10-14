/* 
Author: Justin Nguyen
Last Updated: 10/10/2025 by Justin Nguyen
Purpose: Dropdown sports filter
*/
'use client'
import { availableLeagues } from "@/utils/available-sports"
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem
} from "../ui/dropdown-menu"
import { Button } from "../ui/button"
import { ChevronDown } from "lucide-react"

//will need to pass a handle filter click function to handle the selection of different leagues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SportsFilterDropdown = (props: any) => {

    return (
        <DropdownMenu>
            {/*Button for triggering the drop down*/}
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-text-primary hover:bg-secondary group">
                    Filter
                    <ChevronDown className="m-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent align="start" className="flex flex-col bg-background border-0 text-text-primary">
                    {/*Makes a item for each league in the imported availableLeagues array */}
                    <DropdownMenuLabel>Leagues</DropdownMenuLabel>
                        {availableLeagues.map((league) => (
                            <DropdownMenuCheckboxItem checked={props.selectedLeagues.includes(league)} key={league} onCheckedChange={() => props.handleLeagueSelection(league)}>
                                {league}
                            </DropdownMenuCheckboxItem>
                        ))}
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
    )
}

export default SportsFilterDropdown