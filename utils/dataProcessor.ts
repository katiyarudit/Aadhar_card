
import { AadhaarRecord, StateSummary, RiskAnalysis, AgeDistribution, MonthlyTrend } from '../types';
import { BORDER_STATES, RED_ZONE_PERCENTILE, ALL_STATES, normalizeStateName } from '../constants';

const getMonthKey = (dateStr: string): string => {
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}`;
    return `${parts[2]}-${parts[1].padStart(2, '0')}`;
  }
  return "UNKNOWN";
};

const parseDateString = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
};

export const parseCSV = (csvText: string): AadhaarRecord[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    const standardDate = parseDateString(row.date);
    const age0_5 = parseInt(row.age_0_5) || 0;
    const age5_17 = parseInt(row.age_5_17) || 0;
    const age18 = parseInt(row.age_18_greater) || 0;

    return {
      date: standardDate,
      state: normalizeStateName(row.state),
      district: row.district || "Default District",
      pincode: row.pincode || "000000",
      age_0_5: age0_5,
      age_5_17: age5_17,
      age_18_greater: age18,
      total: age0_5 + age5_17 + age18
    };
  });
};

export const processAnalysis = (data: AadhaarRecord[]) => {
  const stateData: Record<string, AadhaarRecord[]> = {};
  const monthlyStateData: Record<string, Record<string, number>> = {};
  const monthsFound = new Set<string>();

  data.forEach(record => {
    if (!stateData[record.state]) stateData[record.state] = [];
    stateData[record.state].push(record);
    
    const month = getMonthKey(record.date);
    monthsFound.add(month);
    if (!monthlyStateData[month]) monthlyStateData[month] = {};
    monthlyStateData[month][record.state] = (monthlyStateData[month][record.state] || 0) + record.total;
  });

  const stateSummaries: Record<string, StateSummary> = {};
  const risks: RiskAnalysis[] = [];

  Object.entries(stateData).forEach(([stateName, records]) => {
    const dailyTotals: Record<string, number> = {};
    const monthlyTotals: Record<string, number> = {};
    const ageDist: AgeDistribution = { infants: 0, students: 0, adults: 0 };
    const districts: Record<string, any> = {};

    records.forEach(r => {
      dailyTotals[r.date] = (dailyTotals[r.date] || 0) + r.total;
      const m = getMonthKey(r.date);
      monthlyTotals[m] = (monthlyTotals[m] || 0) + r.total;
      ageDist.infants += r.age_0_5;
      ageDist.students += r.age_5_17;
      ageDist.adults += r.age_18_greater;

      const dName = r.district;
      if (!districts[dName]) {
        districts[dName] = { district: dName, totalEnrolments: 0, riskCount: 0, ageDist: { infants: 0, students: 0, adults: 0 }, pincodes: {} };
      }
      districts[dName].totalEnrolments += r.total;
      districts[dName].ageDist.infants += r.age_0_5;
      districts[dName].ageDist.students += r.age_5_17;
      districts[dName].ageDist.adults += r.age_18_greater;
      districts[dName].pincodes[r.pincode] = (districts[dName].pincodes[r.pincode] || 0) + r.total;
    });

    const dailyValues = Object.values(dailyTotals).sort((a, b) => a - b);
    const p95Daily = dailyValues[Math.floor(dailyValues.length * RED_ZONE_PERCENTILE)] || 0;
    const isBorder = BORDER_STATES.includes(stateName);

    Object.entries(dailyTotals).forEach(([date, total]) => {
      if (isBorder && total > p95Daily && total > 50) { 
        risks.push({ state: stateName, dailyTotal: total, percentile95: p95Daily, isBorder, isRedZone: true, date, type: 'DAILY' });
      }
    });

    const monthlyTrends: MonthlyTrend[] = Object.entries(monthlyTotals)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    stateSummaries[stateName] = {
      state: stateName,
      totalEnrolments: records.reduce((acc, r) => acc + r.total, 0),
      riskCount: risks.filter(ri => ri.state === stateName).length,
      status: risks.some(ri => ri.state === stateName) ? 'RED' : 'GREEN',
      ageDist,
      monthlyTrends,
      districts
    };
  });

  return { 
    stateSummaries, 
    risks, 
    monthlyStateData, 
    months: Array.from(monthsFound).sort() 
  };
};

export const generateMockCSV = (): string => {
  let csv = 'date,state,district,pincode,age_0_5,age_5_17,age_18_greater\n';
  const now = new Date();
  ALL_STATES.forEach(state => {
    const districts = [`${state} Central`, `${state} North`, `${state} Frontier`, `${state} Hub`];
    for (let m = 0; m < 6; m++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const year = monthDate.getFullYear();
      const month = (monthDate.getMonth() + 1).toString().padStart(2, '0');
      for (let d = 0; d < 12; d++) {
        const day = (Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const isBorder = BORDER_STATES.includes(state);
        const isSpike = isBorder && Math.random() > 0.94;
        const a1 = isSpike ? 900 : Math.floor(Math.random() * 60);
        const a2 = isSpike ? 1500 : Math.floor(Math.random() * 110);
        const a3 = isSpike ? 2800 : Math.floor(Math.random() * 160);
        const dist = districts[Math.floor(Math.random() * districts.length)];
        csv += `${dateStr},${state},${dist},${Math.floor(100000+Math.random()*800000)},${a1},${a2},${a3}\n`;
      }
    }
  });
  return csv;
};
