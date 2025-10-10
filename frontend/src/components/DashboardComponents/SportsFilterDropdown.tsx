/* 
Author: Justin Nguyen
Last Updated: 10/10/2025 by Justin Nguyen
Purpose: Dropdown sports filter
*/
'use client'
import { useState } from "react"
import { availableLeagues } from "@/utils/available-sports"
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuTrigger
} from "../ui/dropdown-menu"
import { Button } from "../ui/button"
import { ChevronDown } from "lucide-react"

const SportsFilterDropdown = () => {

    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-text-primary hover:bg-secondary group">
                    Filter
                    <ChevronDown className="m-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent align="start" className="flex flex-col bg-background border-0 text-text-primary">
                    <DropdownMenuLabel>Leagues</DropdownMenuLabel>
                        {availableLeagues.map((league) => (
                            <DropdownMenuItem key={league}>{league}</DropdownMenuItem>
                        ))}
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
    )
}

export default SportsFilterDropdown