/* 
Author: Justin Nguyen
Last Updated: 10/08/2025 by Justin Nguyen
Purpose: Creates a team logo using the team colors and abbreviation. Due to trademark laws we can't use actual logos
*/

import { Team } from "./data_class";

export default function createTeamLogo(team: Team) {
    const abbreviation = team.abbreviation
    const primaryColor = `#${team.color}`
    const secondaryColor = `#${team.alternateColor}`
    console.log("abbreviation: ", abbreviation)
    console.log("primaryColor: ", primaryColor)
    console.log("secondaryColor: ", secondaryColor)


    // Simple circular div (uses Tailwind classes for layout and font).
    // Inline styles are used for dynamic colors and size.
    // Render an inline SVG so we can set fills via attributes (avoids inline styles lint).
    const size = 48
    const fontSize = 18
    return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`${abbreviation} logo`}
      role="img"
      className="rounded-full w-24 h-24"
    >
      {/* Circle background */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2}
        fill={primaryColor}
      />

      {/* Centered abbreviation */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={secondaryColor}
        fontFamily='Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial'
        fontWeight="900" // equivalent to Tailwind's font-black
        fontSize={fontSize}
      >
        {abbreviation}
      </text>
    </svg>
  )
}