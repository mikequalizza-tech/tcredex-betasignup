export interface MapFilters {
  // Layer toggles
  show_nmtc: boolean;
  show_lihtc: boolean;
  show_htc: boolean;
  show_oz: boolean;
  show_brownfield: boolean;
  
  // Distress filters
  severely_distressed_only: boolean;
  qct_only: boolean; // Qualified Census Tract
  
  // Geographic filters
  underserved_states_only: boolean;
  
  // Deal filters
  shovel_ready_only: boolean;
  show_deal_pins: boolean;
  
  // Poverty rate range
  min_poverty_rate: number;
  max_poverty_rate: number;
  
  // Project cost range
  min_project_cost: number;
  max_project_cost: number;
}

export const defaultMapFilters: MapFilters = {
  show_nmtc: true,
  show_lihtc: true,
  show_htc: true,
  show_oz: true,
  show_brownfield: false,
  
  severely_distressed_only: false,
  qct_only: false,
  underserved_states_only: false,
  
  shovel_ready_only: false,
  show_deal_pins: true,
  
  min_poverty_rate: 0,
  max_poverty_rate: 100,
  
  min_project_cost: 0,
  max_project_cost: 100000000,
};

// Underserved states for NMTC (states that historically receive less allocation)
export const UNDERSERVED_STATES = [
  'AK', 'AR', 'DE', 'HI', 'ID', 'IA', 'KS', 'KY',
  'ME', 'MS', 'MT', 'NE', 'ND', 'OK', 'SD', 'WV', 'WY'
];

// States with their own NMTC programs
export const STATE_NMTC_PROGRAMS: Record<string, { name: string; allocation?: string }> = {
  'AL': { name: 'Alabama', allocation: '$20M' },
  'AZ': { name: 'Arizona' },
  'AR': { name: 'Arkansas' },
  'CA': { name: 'California' },
  'CO': { name: 'Colorado' },
  'CT': { name: 'Connecticut' },
  'DE': { name: 'Delaware' },
  'FL': { name: 'Florida' },
  'GA': { name: 'Georgia' },
  'HI': { name: 'Hawaii' },
  'IL': { name: 'Illinois' },
  'IN': { name: 'Indiana' },
  'IA': { name: 'Iowa' },
  'KS': { name: 'Kansas' },
  'KY': { name: 'Kentucky' },
  'LA': { name: 'Louisiana' },
  'ME': { name: 'Maine' },
  'MD': { name: 'Maryland' },
  'MA': { name: 'Massachusetts', allocation: '$25M' },
  'MI': { name: 'Michigan' },
  'MN': { name: 'Minnesota' },
  'MS': { name: 'Mississippi' },
  'MO': { name: 'Missouri', allocation: '$15M' },
  'MT': { name: 'Montana' },
  'NE': { name: 'Nebraska' },
  'NV': { name: 'Nevada' },
  'NH': { name: 'New Hampshire' },
  'NJ': { name: 'New Jersey' },
  'NM': { name: 'New Mexico' },
  'NY': { name: 'New York', allocation: '$50M' },
  'NC': { name: 'North Carolina' },
  'ND': { name: 'North Dakota' },
  'OH': { name: 'Ohio' },
  'OK': { name: 'Oklahoma' },
  'OR': { name: 'Oregon' },
  'PA': { name: 'Pennsylvania', allocation: '$30M' },
  'RI': { name: 'Rhode Island' },
  'SC': { name: 'South Carolina' },
  'SD': { name: 'South Dakota' },
  'TN': { name: 'Tennessee' },
  'TX': { name: 'Texas' },
  'UT': { name: 'Utah' },
  'VT': { name: 'Vermont' },
  'WV': { name: 'West Virginia' },
  'WI': { name: 'Wisconsin' },
};

// Color coding for map layers
export const LAYER_COLORS = {
  nmtc: {
    eligible: '#6366f1', // indigo
    severelyDistressed: '#dc2626', // red
  },
  lihtc: {
    qct: '#22c55e', // green
    dda: '#eab308', // yellow (Difficult Development Area)
  },
  oz: {
    active: '#a855f7', // purple
  },
  htc: {
    eligible: '#f97316', // orange
  },
  brownfield: {
    certified: '#78716c', // stone
  },
};

// Distress thresholds
export const DISTRESS_THRESHOLDS = {
  povertyRate: {
    eligible: 20, // NMTC eligibility threshold
    severelyDistressed: 30, // Higher need areas
    extremelyDistressed: 40,
  },
  medianIncome: {
    eligible: 80, // ≤80% of AMI
    severelyDistressed: 60,
  },
  unemployment: {
    elevated: 10,
    high: 15,
  },
};
