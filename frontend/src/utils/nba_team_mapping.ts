/**
 * NBA team ID to display name mappings.
 * Only includes ASCII characters to avoid encoding surprises.
 */

interface NBATeamMetadata {
    name: string;
    abbreviation: string;
    primaryColor: string;
    secondaryColor: string;
}

const TEAM_MAP: Record<number, NBATeamMetadata> = {
    1610612737: { name: 'Atlanta Hawks', abbreviation: 'ATL', primaryColor: '#E03A3E', secondaryColor: '#C1D32F' },
    1610612738: { name: 'Boston Celtics', abbreviation: 'BOS', primaryColor: '#007A33', secondaryColor: '#BA9653' },
    1610612739: { name: 'Cleveland Cavaliers', abbreviation: 'CLE', primaryColor: '#6F263D', secondaryColor: '#FFB81C' },
    1610612740: { name: 'New Orleans Pelicans', abbreviation: 'NOP', primaryColor: '#0C2340', secondaryColor: '#B4975A' },
    1610612741: { name: 'Chicago Bulls', abbreviation: 'CHI', primaryColor: '#CE1141', secondaryColor: '#000000' },
    1610612742: { name: 'Dallas Mavericks', abbreviation: 'DAL', primaryColor: '#00538C', secondaryColor: '#002B5E' },
    1610612743: { name: 'Denver Nuggets', abbreviation: 'DEN', primaryColor: '#0E2240', secondaryColor: '#FEC524' },
    1610612744: { name: 'Golden State Warriors', abbreviation: 'GSW', primaryColor: '#1D428A', secondaryColor: '#FFC72C' },
    1610612745: { name: 'Houston Rockets', abbreviation: 'HOU', primaryColor: '#CE1141', secondaryColor: '#000000' },
    1610612746: { name: 'LA Clippers', abbreviation: 'LAC', primaryColor: '#C8102E', secondaryColor: '#1D428A' },
    1610612747: { name: 'Los Angeles Lakers', abbreviation: 'LAL', primaryColor: '#552583', secondaryColor: '#FDB927' },
    1610612748: { name: 'Miami Heat', abbreviation: 'MIA', primaryColor: '#98002E', secondaryColor: '#F9A01B' },
    1610612749: { name: 'Milwaukee Bucks', abbreviation: 'MIL', primaryColor: '#00471B', secondaryColor: '#EEE1C6' },
    1610612750: { name: 'Minnesota Timberwolves', abbreviation: 'MIN', primaryColor: '#0C2340', secondaryColor: '#236192' },
    1610612751: { name: 'Brooklyn Nets', abbreviation: 'BKN', primaryColor: '#000000', secondaryColor: '#FFFFFF' },
    1610612752: { name: 'New York Knicks', abbreviation: 'NYK', primaryColor: '#006BB6', secondaryColor: '#F58426' },
    1610612753: { name: 'Orlando Magic', abbreviation: 'ORL', primaryColor: '#0077C0', secondaryColor: '#C4CED4' },
    1610612754: { name: 'Indiana Pacers', abbreviation: 'IND', primaryColor: '#041E42', secondaryColor: '#FDBB30' },
    1610612755: { name: 'Philadelphia 76ers', abbreviation: 'PHI', primaryColor: '#006BB6', secondaryColor: '#ED174C' },
    1610612756: { name: 'Phoenix Suns', abbreviation: 'PHX', primaryColor: '#1D1160', secondaryColor: '#E56020' },
    1610612757: { name: 'Portland Trail Blazers', abbreviation: 'POR', primaryColor: '#E03A3E', secondaryColor: '#000000' },
    1610612758: { name: 'Sacramento Kings', abbreviation: 'SAC', primaryColor: '#5A2D81', secondaryColor: '#63727A' },
    1610612759: { name: 'San Antonio Spurs', abbreviation: 'SAS', primaryColor: '#C4CED4', secondaryColor: '#000000' },
    1610612760: { name: 'Oklahoma City Thunder', abbreviation: 'OKC', primaryColor: '#007AC1', secondaryColor: '#EF3B24' },
    1610612761: { name: 'Toronto Raptors', abbreviation: 'TOR', primaryColor: '#CE1141', secondaryColor: '#000000' },
    1610612762: { name: 'Utah Jazz', abbreviation: 'UTA', primaryColor: '#002B5C', secondaryColor: '#F9A01B' },
    1610612763: { name: 'Memphis Grizzlies', abbreviation: 'MEM', primaryColor: '#5D76A9', secondaryColor: '#12173F' },
    1610612764: { name: 'Washington Wizards', abbreviation: 'WAS', primaryColor: '#002B5C', secondaryColor: '#E31837' },
    1610612765: { name: 'Detroit Pistons', abbreviation: 'DET', primaryColor: '#C8102E', secondaryColor: '#006BB6' },
    1610612766: { name: 'Charlotte Hornets', abbreviation: 'CHA', primaryColor: '#00788C', secondaryColor: '#1D1160' }
};

export const getNBATeamName = (teamId: number): string => {
    return TEAM_MAP[teamId]?.name ?? `Team ${teamId}`;
};

export const getNBATeamAbbreviation = (teamId: number): string | undefined => {
    return TEAM_MAP[teamId]?.abbreviation;
};

export const getNBATeamPalette = (teamId: number): { primary: string; secondary: string } => {
    const team = TEAM_MAP[teamId];
    if (!team) {
        return { primary: '#1F2937', secondary: '#F9FAFB' };
    }
    return { primary: team.primaryColor, secondary: team.secondaryColor };
};

export default TEAM_MAP;
