/**
 * NBA team ID to display name mappings.
 * Only includes ASCII characters to avoid encoding surprises.
 */

interface NBATeamMetadata {
    name: string;
    abbreviation: string;
}

const TEAM_MAP: Record<number, NBATeamMetadata> = {
    1610612737: { name: 'Atlanta Hawks', abbreviation: 'ATL' },
    1610612738: { name: 'Boston Celtics', abbreviation: 'BOS' },
    1610612739: { name: 'Cleveland Cavaliers', abbreviation: 'CLE' },
    1610612740: { name: 'New Orleans Pelicans', abbreviation: 'NOP' },
    1610612741: { name: 'Chicago Bulls', abbreviation: 'CHI' },
    1610612742: { name: 'Dallas Mavericks', abbreviation: 'DAL' },
    1610612743: { name: 'Denver Nuggets', abbreviation: 'DEN' },
    1610612744: { name: 'Golden State Warriors', abbreviation: 'GSW' },
    1610612745: { name: 'Houston Rockets', abbreviation: 'HOU' },
    1610612746: { name: 'LA Clippers', abbreviation: 'LAC' },
    1610612747: { name: 'Los Angeles Lakers', abbreviation: 'LAL' },
    1610612748: { name: 'Miami Heat', abbreviation: 'MIA' },
    1610612749: { name: 'Milwaukee Bucks', abbreviation: 'MIL' },
    1610612750: { name: 'Minnesota Timberwolves', abbreviation: 'MIN' },
    1610612751: { name: 'Brooklyn Nets', abbreviation: 'BKN' },
    1610612752: { name: 'New York Knicks', abbreviation: 'NYK' },
    1610612753: { name: 'Orlando Magic', abbreviation: 'ORL' },
    1610612754: { name: 'Indiana Pacers', abbreviation: 'IND' },
    1610612755: { name: 'Philadelphia 76ers', abbreviation: 'PHI' },
    1610612756: { name: 'Phoenix Suns', abbreviation: 'PHX' },
    1610612757: { name: 'Portland Trail Blazers', abbreviation: 'POR' },
    1610612758: { name: 'Sacramento Kings', abbreviation: 'SAC' },
    1610612759: { name: 'San Antonio Spurs', abbreviation: 'SAS' },
    1610612760: { name: 'Oklahoma City Thunder', abbreviation: 'OKC' },
    1610612761: { name: 'Toronto Raptors', abbreviation: 'TOR' },
    1610612762: { name: 'Utah Jazz', abbreviation: 'UTA' },
    1610612763: { name: 'Memphis Grizzlies', abbreviation: 'MEM' },
    1610612764: { name: 'Washington Wizards', abbreviation: 'WAS' },
    1610612765: { name: 'Detroit Pistons', abbreviation: 'DET' },
    1610612766: { name: 'Charlotte Hornets', abbreviation: 'CHA' }
};

export const getNBATeamName = (teamId: number): string => {
    return TEAM_MAP[teamId]?.name ?? `Team ${teamId}`;
};

export const getNBATeamAbbreviation = (teamId: number): string | undefined => {
    return TEAM_MAP[teamId]?.abbreviation;
};

export default TEAM_MAP;
