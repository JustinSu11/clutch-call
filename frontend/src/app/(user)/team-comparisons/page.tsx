'use client';

import React, { useState, useEffect } from 'react';

// -- TYPE DEFINITIONS --

// Defines the allowed sports. Copied from Predictions.tsx
type SportKey = 'All Sports' | 'NFL' | 'NBA' | 'MLS';

// Defines the structure for a single team's data
type Team = {
  name: string;
  form: string;
  logo: string;
  stats: {
    winRate: number;
    avgPointsScored: number;
    avgPointsScoredDiff?: string;
    avgPointsConceded: number;
    avgPointsConcededDiff?: string;
  };
  aiAnalysis: string;
  winProbability: number;
  performance: number[];
};

// Defines the allowed keys for the teams, providing type safety.
// Changed from specific keys to 'string' to allow for dynamic team data per sport.
type TeamKey = string;

// -- COMPONENT DEFINITIONS --

// --- SportsFilter Component (Copied from Predictions.tsx) ---
const SportsFilter: React.FC<{
    sports: SportKey[];
    activeSport: SportKey;
    setActiveSport: (sport: SportKey) => void;
}> = ({ sports, activeSport, setActiveSport }) => (
    <div className="text-text-primary mb-8">
        {sports.map((sport) => (
            <button
                key={sport}
                onClick={() => setActiveSport(sport)}
                className={`px-4 py-2 text-sm text-text-primary font-medium rounded-md whitespace-nowrap ${
                    activeSport === sport
                        ? 'bg-primary text-white' // Using primary color for selection
                        : 'hover:bg-secondary' // Use semantic hover color
                } cursor-pointer mr-2`}
            >
                {sport}
            </button>
        ))}
    </div>
);


// Props for the TeamSelector component
type TeamSelectorProps = {
  teams: Record<TeamKey, Team>; // Use new TeamKey type
  selectedTeam1: TeamKey;
  selectedTeam2: TeamKey;
  onTeam1Change: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onTeam2Change: (event: React.ChangeEvent<HTMLSelectElement>) => void;
};

// Component for team selection dropdowns
function TeamSelector({ teams, selectedTeam1, selectedTeam2, onTeam1Change, onTeam2Change }: TeamSelectorProps) {
  const teamOptions = Object.entries(teams).map(([key, team]) => (
    <option key={key} value={key}>{team.name}</option>
  ));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-6">
        <label htmlFor="team1-select" className="text-sm font-medium text-text-secondary">Select Team 1</label>
        <select 
          id="team1-select"
          value={selectedTeam1} 
          onChange={onTeam1Change}
          className="form-select w-full appearance-none bg-secondary-background border border-secondary rounded-lg h-12 px-4 text-text-primary focus:ring-primary focus:border-primary"
        >
          {teamOptions}
        </select>
      </div>
      <div className="flex flex-col gap-6">
        <label htmlFor="team2-select" className="text-sm font-medium text-text-secondary">Select Team 2</label>
        <select 
          id="team2-select"
          value={selectedTeam2}
          onChange={onTeam2Change}
          className="form-select w-full appearance-none bg-secondary-background border border-secondary rounded-lg h-12 px-4 text-text-primary focus:ring-primary focus:border-primary"
        >
          {teamOptions}
        </select>
      </div>
    </div>
  );
}

// Props for the TeamMatchup component
type TeamMatchupProps = {
  team1: Team;
  team2: Team;
};

// Component to display the two teams facing off
function TeamMatchup({ team1, team2 }: TeamMatchupProps) {
  return (
    <div className="mt-8 grid grid-cols-11 gap-8">
      {/* Team 1 Info */}
      <div className="col-span-5">
        <div className="bg-secondary-background rounded-xl shadow-sm p-6 flex items-center">
          <img alt={`${team1.name} Logo`} className="h-16 w-16 mr-6" src={team1.logo} />
          <div>
            <h3 className="text-2xl font-bold text-text-primary">{team1.name}</h3>
            <p className="text-sm text-text-secondary">{team1.form}</p>
          </div>
        </div>
      </div>

      {/* "VS" Divider */}
      <div className="col-span-1 flex items-center justify-center">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg"> VS </div>
      </div>

      {/* Team 2 Info */}
      <div className="col-span-5">
        <div className="bg-secondary-background rounded-xl shadow-sm p-6 flex items-center justify-end text-right">
          <div>
            <h3 className="text-2xl font-bold text-text-primary">{team2.name}</h3>
            <p className="text-sm text-text-secondary">{team2.form}</p>
          </div>
          <img alt={`${team2.name} Logo`} className="h-16 w-16 ml-6" src={team2.logo} />
        </div>
      </div>
    </div>
  );
}

// Props for the StatBar component
type StatBarProps = {
    label: string;
    value1: number | string;
    value2: number | string;
    diff1?: string;
    isLowerBetter?: boolean;
};

// A smaller, reusable component for a single statistic bar.
function StatBar({ label, value1, value2, diff1, isLowerBetter = false }: StatBarProps) {
    const isTeam1Better = isLowerBetter ? parseFloat(value1.toString()) < parseFloat(value2.toString()) : parseFloat(value1.toString()) > parseFloat(value2.toString());
    const team1Color = isTeam1Better ? 'bg-green-500' : 'bg-red-500';
    const team2Color = !isTeam1Better ? 'bg-green-500' : 'bg-red-500';
    const diff1Color = diff1?.startsWith('+') ? 'text-green-500' : 'text-red-500';
    
    // Normalize values for bar width calculation.
    let maxVal = 100;
    if (label.includes('Points')) {
        maxVal = 120; // NBA max
    } else if (label.includes('Score')) {
         maxVal = 40; // NFL/MLS max
    }

    const width1 = label.includes('Rate') ? value1 : (parseFloat(value1.toString()) / maxVal) * 100;
    const width2 = label.includes('Rate') ? value2 : (parseFloat(value2.toString()) / maxVal) * 100;

    return (
        <div className="flex items-center gap-4">
            <span className="font-semibold text-text-primary w-28 text-right">
                {value1}{label.includes('Rate') ? '%' : ''}
                {diff1 && <span className={`text-xs font-bold ml-1 ${diff1Color}`}>({diff1})</span>}
            </span>
            <div className="w-full bg-secondary rounded-full h-3">
                <div className={`${team1Color} h-3 rounded-full`} style={{ width: `${width1}%` }}></div>
            </div>
            <span className="text-sm text-text-secondary text-center w-40">{label}</span>
            <div className="w-full bg-secondary rounded-full h-3">
                <div className={`${team2Color} h-3 rounded-full`} style={{ width: `${width2}%` }}></div>
            </div>
            <span className="font-semibold text-text-primary w-28 text-left">{value2}{label.includes('Rate') ? '%' : ''}</span>
        </div>
    );
}

// Props for the StatsComparison component
type StatsComparisonProps = {
  team1: Team;
  team2: Team;
  sport: SportKey;
};

// Component for the detailed statistics breakdown
function StatsComparison({ team1, team2, sport }: StatsComparisonProps) {
    // Customize labels based on sport
    const scoreLabel = sport === 'NBA' ? 'Avg. Points Scored' : 'Avg. Score';
    const concededLabel = sport === 'NBA' ? 'Avg. Points Conceded' : 'Avg. Score Conceded';

    return (
        <div className="mt-8 bg-secondary-background rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-text-primary mb-6 text-center">Team Statistics Comparison</h3>
            <div className="space-y-6">
                <StatBar label="Win Rate" value1={team1.stats.winRate} value2={team2.stats.winRate} />
                <StatBar label={scoreLabel} value1={team1.stats.avgPointsScored} value2={team2.stats.avgPointsScored} diff1={team1.stats.avgPointsScoredDiff} />
                <StatBar label={concededLabel} value1={team1.stats.avgPointsConceded} value2={team2.stats.avgPointsConceded} diff1={team1.stats.avgPointsConcededDiff} isLowerBetter={true} />
            </div>
        </div>
    );
}

// Props for the InsightCard component
type InsightCardProps = {
    teamName: string;
    analysis: string;
    winProbability: number;
    probabilityColor: string;
};

// A reusable card for displaying analysis for one team.
function InsightCard({ teamName, analysis, winProbability, probabilityColor }: InsightCardProps) {
    return (
        <div className="bg-secondary-background rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">{teamName} Analysis</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
                {analysis}
            </p>
            <div className="mt-6">
                <h4 className="text-md font-semibold text-text-primary mb-2">Win Probability</h4>
                <div className="w-full bg-secondary rounded-full h-6">
                    <div className={`${probabilityColor} h-6 rounded-full flex items-center justify-center text-white font-bold`} style={{ width: `${winProbability}%` }}>
                        {winProbability}%
                    </div>
                </div>
            </div>
        </div>
    );
}

// Props for the AiInsights component
type AiInsightsProps = {
  team1: Team;
  team2: Team;
};

// Component for the AI-powered insights
function AiInsights({ team1, team2 }: AiInsightsProps) {
  return (
    <div className="mt-12">
      <h2 className="text-3xl font-bold text-text-primary mb-6 text-center">AI Insights &amp; Predictions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <InsightCard 
            teamName={team1.name}
            analysis={team1.aiAnalysis}
            winProbability={team1.winProbability}
            probabilityColor="bg-green-500"
        />
        <InsightCard
            teamName={team2.name}
            analysis={team2.aiAnalysis}
            winProbability={team2.winProbability}
            probabilityColor="bg-red-500"
        />
      </div>
    </div>
  );
}

// Props for the HistoricalChart component
type HistoricalChartProps = {
    team1Data: number[];
    team2Data: number[];
    team1Name: string;
    team2Name: string;
};

// Component for the historical performance chart
function HistoricalChart({ team1Data, team2Data, team1Name, team2Name }: HistoricalChartProps) {
    const viewBoxWidth = 472;
    const viewBoxHeight = 150;

    const generatePath = (data: number[], viewBoxWidth: number, viewBoxHeight: number) => {
        if (!data || data.length === 0) return "";
        const step = viewBoxWidth / (data.length - 1);
        const points = data.map((point, i) => {
            const x = i * step;
            const y = viewBoxHeight - Math.max(0, Math.min(point, viewBoxHeight)); // Clamp values
            return `${x},${y}`;
        });
        return `M ${points[0]} L ${points.slice(1).join(' L ')}`;
    };

    const generateArea = (data: number[], viewBoxWidth: number, viewBoxHeight: number) => {
        const path = generatePath(data, viewBoxWidth, viewBoxHeight);
        if (!path) return "";
        const lastPointX = (data.length - 1) * (viewBoxWidth / (data.length - 1));
        return `${path} L ${lastPointX},${viewBoxHeight} L 0,${viewBoxHeight} Z`;
    };

    const path1 = generatePath(team1Data, viewBoxWidth, viewBoxHeight);
    const area1 = generateArea(team1Data, viewBoxWidth, viewBoxHeight);
    const path2 = generatePath(team2Data, viewBoxWidth, viewBoxHeight);
    const area2 = generateArea(team2Data, viewBoxWidth, viewBoxHeight);

    return (
        <div className="mt-16">
            <h2 className="text-3xl font-bold text-text-primary mb-6 text-center">Historical Head-to-Head Performance</h2>
            <div className="bg-secondary-background rounded-xl shadow-sm p-6">
                <div className="h-80">
                    <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox={`-3 0 ${viewBoxWidth + 6} ${viewBoxHeight}`} xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1" x1={viewBoxWidth / 2} x2={viewBoxWidth / 2} y1="0" y2={viewBoxHeight}>
                                <stop stopColor="#10B981" stopOpacity="0.2"></stop>
                                <stop offset="1" stopColor="#10B981" stopOpacity="0"></stop>
                            </linearGradient>
                            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_2" x1={viewBoxWidth / 2} x2={viewBoxWidth / 2} y1="0" y2={viewBoxHeight}>
                                <stop stopColor="#EF4444" stopOpacity="0.2"></stop>
                                <stop offset="1" stopColor="#EF4444" stopOpacity="0"></stop>
                            </linearGradient>
                        </defs>
                        <path d={area1} fill="url(#paint0_linear_1)"></path>
                        <path d={path1} stroke="#10B981" strokeLinecap="round" strokeWidth="3"></path>
                        <path d={area2} fill="url(#paint0_linear_2)"></path>
                        <path d={path2} stroke="#EF4444" strokeLinecap="round" strokeWidth="3"></path>
                    </svg>
                </div>
                <div className="flex justify-center mt-4 gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-text-secondary">{team1Name} Performance</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span className="text-sm font-medium text-text-secondary">{team2Name} Performance</span>
                    </div>
                </div>
            </div>
        </div>
    );
}


// -- DATA SOURCE --

// Original NBA Data
const nbaTeamData: Record<TeamKey, Team> = {
    lakers: {
        name: "Los Angeles Lakers",
        form: "WWLWL",
        logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAl5Au6Owrj15i6HNGmA_EPV_djlVieSKPigBOtqpkNDdoNgxN76l6KHd_7s6FVr0ap8Dn0bsNAkNwT72CDQKuiu8W0EcZhuxaNyHgCeB865LJaRKtnm5G3jS4917-uUQ0KWnzHW3UWrrpfHJ49Rkh4Rxyqth4ARXykLsVPKuqDxDpfc4QIk1Jl07CQ76krnKyQpbsi4i6J_JrjjIqCBPUV-mJebl3_fkYrtsQAjn-5_YMBHy3YA21NO7vZnPebKzZAtsEfRujopZ8Z",
        stats: { winRate: 65, avgPointsScored: 115.5, avgPointsScoredDiff: "+0.7", avgPointsConceded: 110.2, avgPointsConcededDiff: "-1.3" },
        aiAnalysis: "Our AI predicts a 60% chance of victory for the Lakers. Key factors include their strong offensive efficiency and consistent performance in recent matches.",
        winProbability: 60,
        performance: [41, 129, 109, 57, 117, 49, 89, 105, 29, 1, 69, 19, 99, 125]
    },
    heat: {
        name: "Miami Heat",
        form: "LWWLW",
        logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwzgRMD8VL5QHip5s_toK--eC2MZcufxWsXnjAQwc2SRliFnbDzxkz1uFWmmzW4chgQ-uHt1kRXPS5B2ScAWXzcxBaLnnFwNCg8xdX7Kn5rMiXTmEl3LFpS0Ldm_5PPKsre7HoDJfY-jOiSbWfJkHjA8up_vsbQ6wwyQRS0Whq_s0qUT8oq5YaIegsMGGr2BYwFFOlbO1pDm2vWsxlSRSO2NoJxe8A8BQzXbO2XfeVEdgX9PlpUL1eJBLS2eey6yxyP96xh7KqgzFa",
        stats: { winRate: 58, avgPointsScored: 114.8, avgPointsConceded: 111.5 },
        aiAnalysis: "Our AI predicts a 40% chance of victory for the Heat. Their defensive vulnerabilities and inconsistent scoring are significant concerns.",
        winProbability: 40,
        performance: [65, 110, 85, 130, 60, 90, 40, 80, 20, 120, 50, 90, 30, 105]
    },
    warriors: {
        name: "Golden State Warriors",
        form: "WWWWL",
        logo: "https://upload.wikimedia.org/wikipedia/en/thumb/0/01/Golden_State_Warriors_logo.svg/1200px-Golden_State_Warriors_logo.svg.png",
        stats: { winRate: 72, avgPointsScored: 118.2, avgPointsScoredDiff: "+2.1", avgPointsConceded: 109.5, avgPointsConcededDiff: "-0.5" },
        aiAnalysis: "The Warriors have a 75% win probability due to their exceptional shooting and team chemistry. They are currently the favorites.",
        winProbability: 75,
        performance: [90, 80, 110, 100, 120, 115, 130, 125, 140, 135, 130, 120, 110, 100]
    },
    nets: {
        name: "Brooklyn Nets",
        form: "LWLWL",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Brooklyn_Nets_newlogo.svg/1200px-Brooklyn_Nets_newlogo.svg.png",
        stats: { winRate: 55, avgPointsScored: 112.1, avgPointsConceded: 112.3 },
        aiAnalysis: "The Nets have a 45% chance. Their success hinges on their star players performing at a high level consistently.",
        winProbability: 45,
        performance: [100, 95, 105, 90, 110, 100, 115, 105, 120, 110, 95, 100, 105, 115]
    }
};

// Placeholder NFL Data
const nflTeamData: Record<TeamKey, Team> = {
    cowboys: {
        name: "Dallas Cowboys",
        form: "WWLWW",
        logo: "https://static.www.nfl.com/image/private/f_auto/league/vwwxppjmdwuh1i6fkdeq",
        stats: { winRate: 80, avgPointsScored: 31.5, avgPointsScoredDiff: "+3.2", avgPointsConceded: 20.1, avgPointsConcededDiff: "-1.1" },
        aiAnalysis: "AI predicts a 70% win chance for the Cowboys, citing their dominant offense and strong defensive line.",
        winProbability: 70,
        performance: [20, 30, 28, 35, 40, 24, 31, 38, 27, 19, 33, 29, 36, 41]
    },
    eagles: {
        name: "Philadelphia Eagles",
        form: "WLWLW",
        logo: "https://static.www.nfl.com/image/private/f_auto/league/puhrqgj71r9jypf4cvrn",
        stats: { winRate: 60, avgPointsScored: 28.2, avgPointsConceded: 22.5 },
        aiAnalysis: "AI predicts a 30% win chance for the Eagles. Their secondary has shown vulnerabilities against strong passing games.",
        winProbability: 30,
        performance: [24, 21, 30, 27, 33, 19, 28, 22, 31, 25, 29, 34, 20, 26]
    }
};

// Placeholder MLS Data
const mlsTeamData: Record<TeamKey, Team> = {
    interMiami: {
        name: "Inter Miami CF",
        form: "WWWDW",
        logo: "https://images.mlssoccer.com/image/upload/v1615312030/assets/logos/MIA-Logo-Primary-Bkgd-2021-small.svg",
        stats: { winRate: 75, avgPointsScored: 2.8, avgPointsConceded: 1.1 },
        aiAnalysis: "With their new lineup, AI gives Inter Miami an 80% win probability, highlighting their unmatched offensive firepower.",
        winProbability: 80,
        performance: [1, 3, 2, 2, 4, 1, 3, 3, 2, 1, 4, 3, 2, 3]
    },
    lafc: {
        name: "LAFC",
        form: "LWLDW",
        logo: "https://images.mlssoccer.com/image/upload/v1615312030/assets/logos/LAFC-Logo-Primary-Bkgd-2021-small.svg",
        stats: { winRate: 50, avgPointsScored: 1.9, avgPointsConceded: 1.5 },
        aiAnalysis: "AI predicts a 20% win probability for LAFC. They struggle to contain counter-attacks, which will be a major factor.",
        winProbability: 20,
        performance: [2, 1, 1, 0, 3, 2, 1, 2, 2, 0, 1, 3, 1, 2]
    }
};

// Main data object mapping sports to their respective team data
const allSportsData = {
    'NBA': nbaTeamData,
    'NFL': nflTeamData,
    'MLS': mlsTeamData,
};


// -- MAIN APP COMPONENT --
function App() {
  // Available sports for the filter. 'All Sports' is removed as comparison is sport-specific.
  const sports: SportKey[] = ['NBA', 'NFL', 'MLS'];
  
  // State for the currently selected sport
  const [activeSport, setActiveSport] = useState<SportKey>('NBA');
  
  // Get the team data for the currently active sport
  const currentSportData = allSportsData[activeSport as Exclude<SportKey, 'All Sports'>] || allSportsData['NBA'];
  const currentTeamKeys = Object.keys(currentSportData);

  // State for the selected teams
  const [selectedTeam1Key, setSelectedTeam1Key] = useState<TeamKey>(currentTeamKeys[0]);
  const [selectedTeam2Key, setSelectedTeam2Key] = useState<TeamKey>(currentTeamKeys[1] || currentTeamKeys[0]);

  // Effect to reset selected teams when the sport changes
  useEffect(() => {
    const newSportData = allSportsData[activeSport as Exclude<SportKey, 'All Sports'>] || allSportsData['NBA'];
    const newTeamKeys = Object.keys(newSportData);
    
    // Set to the first two teams of the new sport
    setSelectedTeam1Key(newTeamKeys[0]);
    setSelectedTeam2Key(newTeamKeys[1] || newTeamKeys[0]); // Fallback if only one team exists
  }, [activeSport]);


  const handleTeam1Change = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeam1Key(event.target.value as TeamKey);
  };

  const handleTeam2Change = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeam2Key(event.target.value as TeamKey);
  };

  const team1 = currentSportData[selectedTeam1Key];
  const team2 = currentSportData[selectedTeam2Key];

  // Handle loading or empty state
  if (!team1 || !team2) {
    return (
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-background text-text-primary">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-text-primary mb-8">Team Comparison</h2>
            <SportsFilter sports={sports} activeSport={activeSport} setActiveSport={setActiveSport} />
            <p className="text-center text-text-secondary mt-8">Loading team data...</p>
          </div>
        </main>
    );
  }

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-background text-text-primary">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-text-primary mb-8">Team Comparison</h2>
        
        {/* --- Add the SportsFilter component --- */}
        <SportsFilter sports={sports} activeSport={activeSport} setActiveSport={setActiveSport} />

        <TeamSelector 
          teams={currentSportData}
          selectedTeam1={selectedTeam1Key}
          selectedTeam2={selectedTeam2Key}
          onTeam1Change={handleTeam1Change}
          onTeam2Change={handleTeam2Change}
        />
        <TeamMatchup team1={team1} team2={team2} />
        <StatsComparison team1={team1} team2={team2} sport={activeSport} />
        <AiInsights team1={team1} team2={team2} />
        <HistoricalChart 
          team1Data={team1.performance}
          team2Data={team2.performance}
          team1Name={team1.name}
          team2Name={team2.name}
        />
      </div>
    </main>
  );
}

export default App;

