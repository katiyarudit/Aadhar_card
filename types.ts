
export interface AadhaarRecord {
  date: string;
  state: string;
  district: string;
  pincode: string;
  age_0_5: number;
  age_5_17: number;
  age_18_greater: number;
  total: number;
}

export interface RiskAnalysis {
  state: string;
  dailyTotal: number;
  percentile95: number;
  isBorder: boolean;
  isRedZone: boolean;
  date: string;
  type: 'DAILY' | 'MONTHLY';
}

export interface AgeDistribution {
  infants: number; // 0-5
  students: number; // 5-17
  adults: number; // 18+
}

export interface MonthlyTrend {
  month: string;
  total: number;
}

export interface StateSummary {
  state: string;
  totalEnrolments: number;
  riskCount: number;
  status: 'RED' | 'GREEN';
  ageDist: AgeDistribution;
  monthlyTrends: MonthlyTrend[];
  districts: Record<string, DistrictSummary>;
}

export interface DistrictSummary {
  district: string;
  totalEnrolments: number;
  riskCount: number;
  ageDist: AgeDistribution;
  pincodes: Record<string, number>;
}

export interface InsightData {
  problem: string;
  impact: string;
  solution: string[];
}
