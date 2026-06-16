import type {
  Field,
  PlantingBatch,
  Harvest,
  Inventory,
  Customer,
  Order,
  Shipment,
  Return,
  PriceRecord,
  LossData,
  MonthlyReport,
  FestivalForecast,
  TrendPoint,
  PlantingHistory,
  TempLog,
  OrderItem,
} from '../types';

const genTrend = (base: number): TrendPoint[] => {
  return ['2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'].map(m => ({
    month: m,
    yield: Math.round(base * (0.7 + Math.random() * 0.6)),
  }));
};

const genHistory = (count: number, fieldId: string): PlantingHistory[] => {
  const varieties = ['chrysanthemum', 'lily'] as const;
  const breeds = {
    chrysanthemum: ['白菊', '黄菊', '粉菊', '多头菊'],
    lily: ['西伯利亚', '索邦', '黄天霸', '罗宾那'],
  };
  const history: PlantingHistory[] = [];
  for (let i = 0; i < count; i++) {
    const v = varieties[Math.floor(Math.random() * 2)];
    const b = breeds[v][Math.floor(Math.random() * breeds[v].length)];
    const year = 2024 + Math.floor(i / 6);
    const month = ((i * 2) % 12) + 1;
    const plantedAt = `${year}-${String(month).padStart(2, '0')}-15`;
    const harvestMonth = month + 3 > 12 ? month + 3 - 12 : month + 3;
    const harvestYear = month + 3 > 12 ? year + 1 : year;
    const harvestedAt = `${harvestYear}-${String(harvestMonth).padStart(2, '0')}-20`;
    history.push({
      batchId: `B${fieldId.slice(1)}-${i + 1}`,
      variety: v,
      breed: b,
      plantedAt,
      harvestedAt,
      yield: Math.round(8000 + Math.random() * 15000),
    });
  }
  return history;
};

export const fields: Field[] = [
  { id: 'F001', code: 'A-01', name: '东区1号田', area: 15, location: '东片区A区', soilType: '壤土', irrigation: '滴灌', mainVariety: 'chrysanthemum', status: 'growing', plantedAt: '2026-04-10', harvestAt: '2026-07-15', miniTrend: genTrend(12000), plantingHistory: genHistory(8, 'F001') },
  { id: 'F002', code: 'A-02', name: '东区2号田', area: 12, location: '东片区A区', soilType: '砂壤土', irrigation: '喷灌', mainVariety: 'chrysanthemum', status: 'harvesting', plantedAt: '2026-01-20', harvestAt: '2026-05-10', miniTrend: genTrend(10000), plantingHistory: genHistory(7, 'F002') },
  { id: 'F003', code: 'A-03', name: '东区3号田', area: 18, location: '东片区A区', soilType: '壤土', irrigation: '滴灌', mainVariety: 'lily', status: 'growing', plantedAt: '2026-03-05', harvestAt: '2026-06-25', miniTrend: genTrend(15000), plantingHistory: genHistory(6, 'F003') },
  { id: 'F004', code: 'B-01', name: '西区1号田', area: 20, location: '西片区B区', soilType: '粘壤土', irrigation: '滴灌', mainVariety: 'chrysanthemum', status: 'idle', plantedAt: null, harvestAt: null, miniTrend: genTrend(18000), plantingHistory: genHistory(9, 'F004') },
  { id: 'F005', code: 'B-02', name: '西区2号田', area: 16, location: '西片区B区', soilType: '壤土', irrigation: '喷灌', mainVariety: 'lily', status: 'growing', plantedAt: '2026-05-01', harvestAt: '2026-08-20', miniTrend: genTrend(13000), plantingHistory: genHistory(5, 'F005') },
  { id: 'F006', code: 'B-03', name: '西区3号田', area: 14, location: '西片区B区', soilType: '砂壤土', irrigation: '滴灌', mainVariety: 'chrysanthemum', status: 'fallow', plantedAt: null, harvestAt: null, miniTrend: genTrend(11000), plantingHistory: genHistory(10, 'F006') },
  { id: 'F007', code: 'C-01', name: '南区1号田', area: 22, location: '南片区C区', soilType: '壤土', irrigation: '滴灌', mainVariety: 'lily', status: 'harvesting', plantedAt: '2026-02-15', harvestAt: '2026-06-10', miniTrend: genTrend(16000), plantingHistory: genHistory(7, 'F007') },
  { id: 'F008', code: 'C-02', name: '南区2号田', area: 10, location: '南片区C区', soilType: '粘壤土', irrigation: '喷灌', mainVariety: 'chrysanthemum', status: 'growing', plantedAt: '2026-04-25', harvestAt: '2026-08-05', miniTrend: genTrend(8000), plantingHistory: genHistory(6, 'F008') },
  { id: 'F009', code: 'C-03', name: '南区3号田', area: 19, location: '南片区C区', soilType: '壤土', irrigation: '滴灌', mainVariety: 'chrysanthemum', status: 'idle', plantedAt: null, harvestAt: null, miniTrend: genTrend(14000), plantingHistory: genHistory(8, 'F009') },
  { id: 'F010', code: 'D-01', name: '北区1号田', area: 25, location: '北片区D区', soilType: '砂壤土', irrigation: '滴灌', mainVariety: 'lily', status: 'growing', plantedAt: '2026-03-20', harvestAt: '2026-07-10', miniTrend: genTrend(20000), plantingHistory: genHistory(9, 'F010') },
  { id: 'F011', code: 'D-02', name: '北区2号田', area: 17, location: '北片区D区', soilType: '壤土', irrigation: '喷灌', mainVariety: 'chrysanthemum', status: 'harvesting', plantedAt: '2026-01-10', harvestAt: '2026-05-05', miniTrend: genTrend(13000), plantingHistory: genHistory(7, 'F011') },
  { id: 'F012', code: 'D-03', name: '北区3号田', area: 13, location: '北片区D区', soilType: '粘壤土', irrigation: '滴灌', mainVariety: 'lily', status: 'fallow', plantedAt: null, harvestAt: null, miniTrend: genTrend(10000), plantingHistory: genHistory(8, 'F012') },
  { id: 'F013', code: 'E-01', name: '中心区1号田', area: 21, location: '中心E区', soilType: '壤土', irrigation: '滴灌', mainVariety: 'chrysanthemum', status: 'growing', plantedAt: '2026-05-15', harvestAt: '2026-09-01', miniTrend: genTrend(17000), plantingHistory: genHistory(6, 'F013') },
  { id: 'F014', code: 'E-02', name: '中心区2号田', area: 11, location: '中心E区', soilType: '砂壤土', irrigation: '喷灌', mainVariety: 'carnation', status: 'idle', plantedAt: null, harvestAt: null, miniTrend: genTrend(9000), plantingHistory: genHistory(5, 'F014') },
];

export const plantingBatches: PlantingBatch[] = [
  { id: 'B001', fieldId: 'F001', variety: 'chrysanthemum', breed: '白菊', area: 15, plantedAt: '2026-04-10', expectedHarvestAt: '2026-07-15', forecastYield: 135000, season: '夏季', status: 'growing' },
  { id: 'B002', fieldId: 'F002', variety: 'chrysanthemum', breed: '黄菊', area: 12, plantedAt: '2026-01-20', expectedHarvestAt: '2026-05-10', forecastYield: 108000, season: '春季', status: 'harvested' },
  { id: 'B003', fieldId: 'F003', variety: 'lily', breed: '西伯利亚', area: 18, plantedAt: '2026-03-05', expectedHarvestAt: '2026-06-25', forecastYield: 162000, season: '夏季', status: 'ready' },
  { id: 'B004', fieldId: 'F005', variety: 'lily', breed: '索邦', area: 16, plantedAt: '2026-05-01', expectedHarvestAt: '2026-08-20', forecastYield: 144000, season: '秋季', status: 'growing' },
  { id: 'B005', fieldId: 'F007', variety: 'lily', breed: '黄天霸', area: 22, plantedAt: '2026-02-15', expectedHarvestAt: '2026-06-10', forecastYield: 198000, season: '夏季', status: 'harvesting' },
  { id: 'B006', fieldId: 'F008', variety: 'chrysanthemum', breed: '粉菊', area: 10, plantedAt: '2026-04-25', expectedHarvestAt: '2026-08-05', forecastYield: 90000, season: '秋季', status: 'growing' },
  { id: 'B007', fieldId: 'F010', variety: 'lily', breed: '罗宾那', area: 25, plantedAt: '2026-03-20', expectedHarvestAt: '2026-07-10', forecastYield: 225000, season: '夏季', status: 'growing' },
  { id: 'B008', fieldId: 'F011', variety: 'chrysanthemum', breed: '多头菊', area: 17, plantedAt: '2026-01-10', expectedHarvestAt: '2026-05-05', forecastYield: 153000, season: '春季', status: 'harvested' },
  { id: 'B009', fieldId: 'F013', variety: 'chrysanthemum', breed: '白菊', area: 21, plantedAt: '2026-05-15', expectedHarvestAt: '2026-09-01', forecastYield: 189000, season: '秋季', status: 'planted' },
  { id: 'B010', fieldId: 'F001', variety: 'chrysanthemum', breed: '黄菊', area: 15, plantedAt: '2025-12-20', expectedHarvestAt: '2026-04-05', forecastYield: 135000, season: '清明高峰', status: 'completed' },
  { id: 'B011', fieldId: 'F002', variety: 'chrysanthemum', breed: '白菊', area: 12, plantedAt: '2025-11-25', expectedHarvestAt: '2026-03-15', forecastYield: 108000, season: '清明高峰', status: 'completed' },
  { id: 'B012', fieldId: 'F004', variety: 'chrysanthemum', breed: '多头菊', area: 20, plantedAt: '2025-12-10', expectedHarvestAt: '2026-04-01', forecastYield: 180000, season: '清明高峰', status: 'completed' },
  { id: 'B013', fieldId: 'F006', variety: 'chrysanthemum', breed: '黄菊', area: 14, plantedAt: '2025-11-15', expectedHarvestAt: '2026-03-10', forecastYield: 126000, season: '清明高峰', status: 'completed' },
  { id: 'B014', fieldId: 'F009', variety: 'chrysanthemum', breed: '白菊', area: 19, plantedAt: '2025-12-05', expectedHarvestAt: '2026-03-25', forecastYield: 171000, season: '清明高峰', status: 'completed' },
  { id: 'B015', fieldId: 'F001', variety: 'chrysanthemum', breed: '黄菊', area: 15, plantedAt: '2026-08-15', expectedHarvestAt: '2026-12-01', forecastYield: 142500, season: '冬至高峰', status: 'planned' },
  { id: 'B016', fieldId: 'F004', variety: 'chrysanthemum', breed: '白菊', area: 20, plantedAt: '2026-08-20', expectedHarvestAt: '2026-12-10', forecastYield: 190000, season: '冬至高峰', status: 'planned' },
  { id: 'B017', fieldId: 'F006', variety: 'chrysanthemum', breed: '多头菊', area: 14, plantedAt: '2026-08-01', expectedHarvestAt: '2026-11-20', forecastYield: 133000, season: '冬至高峰', status: 'planned' },
  { id: 'B018', fieldId: 'F009', variety: 'chrysanthemum', breed: '粉菊', area: 19, plantedAt: '2026-08-10', expectedHarvestAt: '2026-11-28', forecastYield: 180500, season: '冬至高峰', status: 'planned' },
  { id: 'B019', fieldId: 'F012', variety: 'lily', breed: '西伯利亚', area: 13, plantedAt: '2026-06-01', expectedHarvestAt: '2026-09-20', forecastYield: 117000, season: '秋季', status: 'growing' },
  { id: 'B020', fieldId: 'F003', variety: 'lily', breed: '索邦', area: 18, plantedAt: '2026-06-15', expectedHarvestAt: '2026-10-05', forecastYield: 171000, season: '秋季', status: 'planted' },
  { id: 'B021', fieldId: 'F010', variety: 'lily', breed: '黄天霸', area: 25, plantedAt: '2026-07-01', expectedHarvestAt: '2026-10-20', forecastYield: 237500, season: '秋季', status: 'planned' },
  { id: 'B022', fieldId: 'F007', variety: 'lily', breed: '罗宾那', area: 22, plantedAt: '2026-06-20', expectedHarvestAt: '2026-10-10', forecastYield: 209000, season: '秋季', status: 'growing' },
];

export const harvests: Harvest[] = [
  { id: 'H001', batchId: 'B002', fieldId: 'F002', harvestedAt: '2026-05-08', quantity: 102600, staff: '张伟', gradeAQty: 35910, gradeBQty: 41040, gradeCQty: 20520, defectiveQty: 5130 },
  { id: 'H002', batchId: 'B008', fieldId: 'F011', harvestedAt: '2026-05-03', quantity: 146880, staff: '李强', gradeAQty: 51408, gradeBQty: 58752, gradeCQty: 29376, defectiveQty: 7344 },
  { id: 'H003', batchId: 'B010', fieldId: 'F001', harvestedAt: '2026-04-03', quantity: 129600, staff: '王芳', gradeAQty: 45360, gradeBQty: 51840, gradeCQty: 25920, defectiveQty: 6480 },
  { id: 'H004', batchId: 'B011', fieldId: 'F002', harvestedAt: '2026-03-13', quantity: 103680, staff: '刘洋', gradeAQty: 36288, gradeBQty: 41472, gradeCQty: 20736, defectiveQty: 5184 },
  { id: 'H005', batchId: 'B012', fieldId: 'F004', harvestedAt: '2026-03-30', quantity: 172800, staff: '陈静', gradeAQty: 60480, gradeBQty: 69120, gradeCQty: 34560, defectiveQty: 8640 },
  { id: 'H006', batchId: 'B013', fieldId: 'F006', harvestedAt: '2026-03-08', quantity: 120960, staff: '杨帆', gradeAQty: 42336, gradeBQty: 48384, gradeCQty: 24192, defectiveQty: 6048 },
  { id: 'H007', batchId: 'B014', fieldId: 'F009', harvestedAt: '2026-03-23', quantity: 164160, staff: '赵磊', gradeAQty: 57456, gradeBQty: 65664, gradeCQty: 32832, defectiveQty: 8208 },
  { id: 'H008', batchId: 'B005', fieldId: 'F007', harvestedAt: '2026-06-08', quantity: 189504, staff: '张伟', gradeAQty: 66326, gradeBQty: 75802, gradeCQty: 37901, defectiveQty: 9475 },
  { id: 'H009', batchId: 'B003', fieldId: 'F003', harvestedAt: '2026-06-23', quantity: 155520, staff: '李强', gradeAQty: 54432, gradeBQty: 62208, gradeCQty: 31104, defectiveQty: 7776 },
  { id: 'H010', batchId: 'B002', fieldId: 'F002', harvestedAt: '2026-05-10', quantity: 5400, staff: '王芳', gradeAQty: 1890, gradeBQty: 2160, gradeCQty: 1080, defectiveQty: 270 },
  { id: 'H011', batchId: 'B008', fieldId: 'F011', harvestedAt: '2026-05-05', quantity: 6120, staff: '刘洋', gradeAQty: 2142, gradeBQty: 2448, gradeCQty: 1224, defectiveQty: 306 },
  { id: 'H012', batchId: 'B005', fieldId: 'F007', harvestedAt: '2026-06-10', quantity: 8496, staff: '陈静', gradeAQty: 2974, gradeBQty: 3398, gradeCQty: 1699, defectiveQty: 425 },
  { id: 'H013', batchId: 'B010', fieldId: 'F001', harvestedAt: '2026-04-05', quantity: 5400, staff: '杨帆', gradeAQty: 1890, gradeBQty: 2160, gradeCQty: 1080, defectiveQty: 270 },
  { id: 'H014', batchId: 'B012', fieldId: 'F004', harvestedAt: '2026-04-01', quantity: 7200, staff: '赵磊', gradeAQty: 2520, gradeBQty: 2880, gradeCQty: 1440, defectiveQty: 360 },
  { id: 'H015', batchId: 'B003', fieldId: 'F003', harvestedAt: '2026-06-25', quantity: 6480, staff: '张伟', gradeAQty: 2268, gradeBQty: 2592, gradeCQty: 1296, defectiveQty: 324 },
  { id: 'H016', batchId: 'B011', fieldId: 'F002', harvestedAt: '2026-03-15', quantity: 4320, staff: '李强', gradeAQty: 1512, gradeBQty: 1728, gradeCQty: 864, defectiveQty: 216 },
];

export const inventories: Inventory[] = [
  { id: 'I001', harvestId: 'H001', variety: 'chrysanthemum', grade: 'A', quantity: 28000, preCooledAt: '2026-05-08T14:00:00', preCoolTemp: 2, preCoolDuration: 4, preservative: 'STS保鲜剂', location: 'A区-01', status: 'stored' },
  { id: 'I002', harvestId: 'H001', variety: 'chrysanthemum', grade: 'B', quantity: 32000, preCooledAt: '2026-05-08T14:30:00', preCoolTemp: 2, preCoolDuration: 4, preservative: 'STS保鲜剂', location: 'A区-02', status: 'stored' },
  { id: 'I003', harvestId: 'H001', variety: 'chrysanthemum', grade: 'C', quantity: 15000, preCooledAt: '2026-05-08T15:00:00', preCoolTemp: 2, preCoolDuration: 3, preservative: '8-HQS保鲜剂', location: 'C区-01', status: 'stored' },
  { id: 'I004', harvestId: 'H002', variety: 'chrysanthemum', grade: 'A', quantity: 40000, preCooledAt: '2026-05-03T13:00:00', preCoolTemp: 2, preCoolDuration: 4, preservative: 'STS保鲜剂', location: 'A区-03', status: 'allocated' },
  { id: 'I005', harvestId: 'H002', variety: 'chrysanthemum', grade: 'B', quantity: 46000, preCooledAt: '2026-05-03T13:30:00', preCoolTemp: 2, preCoolDuration: 4, preservative: 'STS保鲜剂', location: 'A区-04', status: 'stored' },
  { id: 'I006', harvestId: 'H002', variety: 'chrysanthemum', grade: 'C', quantity: 22000, preCooledAt: '2026-05-03T14:00:00', preCoolTemp: 2, preCoolDuration: 3, preservative: '8-HQS保鲜剂', location: 'C区-02', status: 'sold' },
  { id: 'I007', harvestId: 'H003', variety: 'chrysanthemum', grade: 'A', quantity: 35000, preCooledAt: '2026-04-03T14:00:00', preCoolTemp: 2, preCoolDuration: 4, preservative: 'STS保鲜剂', location: 'A区-05', status: 'sold' },
  { id: 'I008', harvestId: 'H003', variety: 'chrysanthemum', grade: 'B', quantity: 40000, preCooledAt: '2026-04-03T14:30:00', preCoolTemp: 2, preCoolDuration: 4, preservative: 'STS保鲜剂', location: 'A区-06', status: 'sold' },
  { id: 'I009', harvestId: 'H004', variety: 'chrysanthemum', grade: 'A', quantity: 28000, preCooledAt: '2026-03-13T14:00:00', preCoolTemp: 2, preCoolDuration: 4, preservative: 'STS保鲜剂', location: 'B区-01', status: 'shipped' },
  { id: 'I010', harvestId: 'H005', variety: 'chrysanthemum', grade: 'A', quantity: 47000, preCooledAt: '2026-03-30T14:00:00', preCoolTemp: 2, preCoolDuration: 4, preservative: 'STS保鲜剂', location: 'B区-02', status: 'sold' },
  { id: 'I011', harvestId: 'H005', variety: 'chrysanthemum', grade: 'B', quantity: 53000, preCooledAt: '2026-03-30T14:30:00', preCoolTemp: 2, preCoolDuration: 4, preservative: 'STS保鲜剂', location: 'B区-03', status: 'sold' },
  { id: 'I012', harvestId: 'H007', variety: 'chrysanthemum', grade: 'A', quantity: 44000, preCooledAt: '2026-03-23T14:00:00', preCoolTemp: 2, preCoolDuration: 4, preservative: 'STS保鲜剂', location: 'B区-04', status: 'shipped' },
  { id: 'I013', harvestId: 'H008', variety: 'lily', grade: 'A', quantity: 50000, preCooledAt: '2026-06-08T14:00:00', preCoolTemp: 1, preCoolDuration: 5, preservative: '百合专用保鲜剂', location: 'D区-01', status: 'stored' },
  { id: 'I014', harvestId: 'H008', variety: 'lily', grade: 'B', quantity: 58000, preCooledAt: '2026-06-08T14:30:00', preCoolTemp: 1, preCoolDuration: 5, preservative: '百合专用保鲜剂', location: 'D区-02', status: 'stored' },
  { id: 'I015', harvestId: 'H008', variety: 'lily', grade: 'C', quantity: 28000, preCooledAt: '2026-06-08T15:00:00', preCoolTemp: 1, preCoolDuration: 4, preservative: '8-HQS保鲜剂', location: 'D区-03', status: 'stored' },
  { id: 'I016', harvestId: 'H009', variety: 'lily', grade: 'A', quantity: 42000, preCooledAt: '2026-06-23T14:00:00', preCoolTemp: 1, preCoolDuration: 5, preservative: '百合专用保鲜剂', location: 'D区-04', status: 'precooling' },
  { id: 'I017', harvestId: 'H009', variety: 'lily', grade: 'B', quantity: 48000, preCooledAt: '2026-06-23T14:30:00', preCoolTemp: 1, preCoolDuration: 5, preservative: '百合专用保鲜剂', location: 'D区-05', status: 'precooling' },
  { id: 'I018', harvestId: 'H009', variety: 'lily', grade: 'C', quantity: 23000, preCooledAt: '2026-06-23T15:00:00', preCoolTemp: 1, preCoolDuration: 4, preservative: '8-HQS保鲜剂', location: 'D区-06', status: 'precooling' },
  { id: 'I019', harvestId: 'H006', variety: 'chrysanthemum', grade: 'A', quantity: 32000, preCooledAt: '2026-03-08T14:00:00', preCoolTemp: 2, preCoolDuration: 4, preservative: 'STS保鲜剂', location: 'B区-05', status: 'expired' },
  { id: 'I020', harvestId: 'H006', variety: 'chrysanthemum', grade: 'B', quantity: 37000, preCooledAt: '2026-03-08T14:30:00', preCoolTemp: 2, preCoolDuration: 4, preservative: 'STS保鲜剂', location: 'B区-06', status: 'sold' },
  { id: 'I021', harvestId: 'H012', variety: 'lily', grade: 'A', quantity: 2800, preCooledAt: '2026-06-10T14:00:00', preCoolTemp: 1, preCoolDuration: 5, preservative: '百合专用保鲜剂', location: 'D区-07', status: 'stored' },
  { id: 'I022', harvestId: 'H015', variety: 'lily', grade: 'B', quantity: 2000, preCooledAt: '2026-06-25T14:00:00', preCoolTemp: 1, preCoolDuration: 5, preservative: '百合专用保鲜剂', location: 'D区-08', status: 'stored' },
];

export const customers: Customer[] = [
  { id: 'C001', name: '上海龙华殡仪馆', type: 'funeral_home', contact: '周经理', phone: '13800138001', address: '上海市徐汇区漕溪路210号', level: 'A', creditLimit: 500000, paymentTerms: 30, usedCredit: 285000, status: 'active', totalPurchases: 3280000, joinDate: '2023-03-15' },
  { id: 'C002', name: '北京八宝山殡仪馆', type: 'funeral_home', contact: '吴主任', phone: '13800138002', address: '北京市石景山区石景山路9号', level: 'A', creditLimit: 600000, paymentTerms: 45, usedCredit: 412000, status: 'active', totalPurchases: 4560000, joinDate: '2022-11-20' },
  { id: 'C003', name: '广州银河园', type: 'funeral_home', contact: '郑科长', phone: '13800138003', address: '广州市天河区燕岭路418号', level: 'A', creditLimit: 450000, paymentTerms: 30, usedCredit: 198000, status: 'active', totalPurchases: 2180000, joinDate: '2024-01-10' },
  { id: 'C004', name: '花语轩精品花店', type: 'flower_shop', contact: '林小姐', phone: '13800138004', address: '杭州市西湖区文三路128号', level: 'B', creditLimit: 100000, paymentTerms: 15, usedCredit: 45000, status: 'active', totalPurchases: 380000, joinDate: '2024-05-08' },
  { id: 'C005', name: '锦绣花艺生活馆', type: 'flower_shop', contact: '陈女士', phone: '13800138005', address: '成都市锦江区春熙路68号', level: 'B', creditLimit: 80000, paymentTerms: 15, usedCredit: 32000, status: 'active', totalPurchases: 290000, joinDate: '2024-08-15' },
  { id: 'C006', name: '深圳花卉世界批发中心', type: 'distributor', contact: '黄总', phone: '13800138006', address: '深圳市福田区红荔西路花卉世界', level: 'A', creditLimit: 800000, paymentTerms: 30, usedCredit: 568000, status: 'active', totalPurchases: 6890000, joinDate: '2022-06-01' },
  { id: 'C007', name: '昆明斗南花卉批发', type: 'distributor', contact: '李总', phone: '13800138007', address: '昆明市呈贡区斗南花卉市场', level: 'A', creditLimit: 1000000, paymentTerms: 45, usedCredit: 725000, status: 'active', totalPurchases: 8520000, joinDate: '2022-01-18' },
  { id: 'C008', name: '南京花卉集散中心', type: 'distributor', contact: '王经理', phone: '13800138008', address: '南京市江宁区众彩物流园', level: 'B', creditLimit: 350000, paymentTerms: 30, usedCredit: 185000, status: 'active', totalPurchases: 1680000, joinDate: '2023-09-25' },
  { id: 'C009', name: '浪漫时光花艺坊', type: 'flower_shop', contact: '徐小姐', phone: '13800138009', address: '武汉市江汉区江汉路108号', level: 'C', creditLimit: 50000, paymentTerms: 7, usedCredit: 12000, status: 'active', totalPurchases: 168000, joinDate: '2025-02-14' },
  { id: 'C010', name: '西安殡仪馆', type: 'funeral_home', contact: '马主任', phone: '13800138010', address: '西安市未央区三桥街道', level: 'B', creditLimit: 300000, paymentTerms: 30, usedCredit: 142000, status: 'active', totalPurchases: 1520000, joinDate: '2023-07-20' },
  { id: 'C011', name: '重庆鲜花批发市场', type: 'distributor', contact: '胡总', phone: '13800138011', address: '重庆市渝中区较场口', level: 'B', creditLimit: 400000, paymentTerms: 30, usedCredit: 215000, status: 'inactive', totalPurchases: 980000, joinDate: '2024-03-10' },
  { id: 'C012', name: '花开富贵网上花店', type: 'retail', contact: '孙女士', phone: '13800138012', address: '苏州市姑苏区平江路188号', level: 'D', creditLimit: 20000, paymentTerms: 7, usedCredit: 0, status: 'active', totalPurchases: 68000, joinDate: '2025-06-01' },
];

const genOrderItems = (baseAmount: number): OrderItem[] => {
  const varieties = ['chrysanthemum', 'lily'] as const;
  const grades = ['A', 'B', 'C'] as const;
  const prices = {
    chrysanthemum: { A: 3.5, B: 2.5, C: 1.5 },
    lily: { A: 8, B: 6, C: 4 },
    rose: { A: 5, B: 3.5, C: 2 },
    carnation: { A: 3, B: 2, C: 1.2 },
    gladiolus: { A: 4, B: 2.8, C: 1.8 },
  };
  const items: OrderItem[] = [];
  const itemCount = 2 + Math.floor(Math.random() * 3);
  let remaining = baseAmount;
  for (let i = 0; i < itemCount; i++) {
    const v = varieties[Math.floor(Math.random() * varieties.length)];
    const g = grades[Math.floor(Math.random() * (i === itemCount - 1 ? 3 : 2))];
    const unitPrice = prices[v][g];
    const amount = i === itemCount - 1 ? remaining : Math.round(remaining * (0.3 + Math.random() * 0.4));
    const quantity = Math.round(amount / unitPrice / 10) * 10;
    const actualAmount = quantity * unitPrice;
    remaining -= actualAmount;
    items.push({
      id: `OI-${Date.now()}-${i}`,
      variety: v,
      grade: g,
      quantity,
      unitPrice,
    });
  }
  return items;
};

export const orders: Order[] = [
  { id: 'O001', orderNo: 'DD202606010001', customerId: 'C001', createdAt: '2026-06-01T09:30:00', deliveryDate: '2026-06-05', deliveryAddress: '上海市徐汇区漕溪路210号', totalAmount: 128500, status: 'completed', items: genOrderItems(128500), remarks: '清明后常规补货，优先A级白菊' },
  { id: 'O002', orderNo: 'DD202606020002', customerId: 'C007', createdAt: '2026-06-02T10:15:00', deliveryDate: '2026-06-08', deliveryAddress: '昆明市呈贡区斗南花卉市场', totalAmount: 286000, status: 'shipped', items: genOrderItems(286000), remarks: '大宗批发，需冷链配送' },
  { id: 'O003', orderNo: 'DD202606050003', customerId: 'C004', createdAt: '2026-06-05T14:20:00', deliveryDate: '2026-06-09', deliveryAddress: '杭州市西湖区文三路128号', totalAmount: 28500, status: 'picking', items: genOrderItems(28500), remarks: '端午花店备货' },
  { id: 'O004', orderNo: 'DD202606080004', customerId: 'C002', createdAt: '2026-06-08T08:45:00', deliveryDate: '2026-06-12', deliveryAddress: '北京市石景山区石景山路9号', totalAmount: 185000, status: 'confirmed', items: genOrderItems(185000), remarks: '月度常规采购' },
  { id: 'O005', orderNo: 'DD202606100005', customerId: 'C006', createdAt: '2026-06-10T11:00:00', deliveryDate: '2026-06-15', deliveryAddress: '深圳市福田区红荔西路花卉世界', totalAmount: 356000, status: 'pending', items: genOrderItems(356000), remarks: '待确认价格' },
  { id: 'O006', orderNo: 'DD202605280006', customerId: 'C003', createdAt: '2026-05-28T15:30:00', deliveryDate: '2026-06-02', deliveryAddress: '广州市天河区燕岭路418号', totalAmount: 142000, status: 'completed', items: genOrderItems(142000), remarks: '已完成，无售后' },
  { id: 'O007', orderNo: 'DD202606120007', customerId: 'C010', createdAt: '2026-06-12T09:00:00', deliveryDate: '2026-06-18', deliveryAddress: '西安市未央区三桥街道', totalAmount: 98000, status: 'confirmed', items: genOrderItems(98000), remarks: '' },
  { id: 'O008', orderNo: 'DD202606150008', customerId: 'C008', createdAt: '2026-06-15T13:45:00', deliveryDate: '2026-06-20', deliveryAddress: '南京市江宁区众彩物流园', totalAmount: 215000, status: 'picking', items: genOrderItems(215000), remarks: '集散中心大宗采购' },
  { id: 'O009', orderNo: 'DD202605200009', customerId: 'C005', createdAt: '2026-05-20T10:20:00', deliveryDate: '2026-05-25', deliveryAddress: '成都市锦江区春熙路68号', totalAmount: 32000, status: 'completed', items: genOrderItems(32000), remarks: '520节日备货' },
  { id: 'O010', orderNo: 'DD202606180010', customerId: 'C009', createdAt: '2026-06-18T16:00:00', deliveryDate: '2026-06-22', deliveryAddress: '武汉市江汉区江汉路108号', totalAmount: 18500, status: 'pending', items: genOrderItems(18500), remarks: '' },
  { id: 'O011', orderNo: 'DD202606030011', customerId: 'C001', createdAt: '2026-06-03T14:00:00', deliveryDate: '2026-06-07', deliveryAddress: '上海市徐汇区漕溪路210号', totalAmount: 165000, status: 'completed', items: genOrderItems(165000), remarks: '加急订单' },
  { id: 'O012', orderNo: 'DD202604010012', customerId: 'C001', createdAt: '2026-04-01T08:00:00', deliveryDate: '2026-04-03', deliveryAddress: '上海市徐汇区漕溪路210号', totalAmount: 485000, status: 'completed', items: genOrderItems(485000), remarks: '清明节高峰订单' },
  { id: 'O013', orderNo: 'DD202604020013', customerId: 'C002', createdAt: '2026-04-02T09:30:00', deliveryDate: '2026-04-04', deliveryAddress: '北京市石景山区石景山路9号', totalAmount: 528000, status: 'completed', items: genOrderItems(528000), remarks: '清明节高峰订单' },
  { id: 'O014', orderNo: 'DD202606200014', customerId: 'C012', createdAt: '2026-06-20T11:15:00', deliveryDate: '2026-06-24', deliveryAddress: '苏州市姑苏区平江路188号', totalAmount: 6800, status: 'cancelled', items: genOrderItems(6800), remarks: '客户取消订单' },
  { id: 'O015', orderNo: 'DD202606220015', customerId: 'C006', createdAt: '2026-06-22T10:00:00', deliveryDate: '2026-06-28', deliveryAddress: '深圳市福田区红荔西路花卉世界', totalAmount: 412000, status: 'confirmed', items: genOrderItems(412000), remarks: '618后续补货' },
  { id: 'O016', orderNo: 'DD202606250016', customerId: 'C007', createdAt: '2026-06-25T15:00:00', deliveryDate: '2026-07-01', deliveryAddress: '昆明市呈贡区斗南花卉市场', totalAmount: 298000, status: 'pending', items: genOrderItems(298000), remarks: '7月采购计划' },
];

const genTempLogs = (count: number, departedAt: string): TempLog[] => {
  const logs: TempLog[] = [];
  const base = new Date(departedAt).getTime();
  for (let i = 0; i < count; i++) {
    const t = new Date(base + i * 1800000);
    logs.push({
      time: t.toISOString().replace('T', ' ').slice(0, 19),
      temperature: Math.round((1.5 + Math.random() * 2) * 10) / 10,
      humidity: Math.round((75 + Math.random() * 15) * 10) / 10,
    });
  }
  return logs;
};

export const shipments: Shipment[] = [
  { id: 'S001', orderId: 'O001', vehicleNo: '沪A-88888', driver: '张师傅', departedAt: '2026-06-05T06:00:00', estimatedArrival: '2026-06-05T12:00:00', arrivedAt: '2026-06-05T11:45:00', status: 'completed', tempLogs: genTempLogs(20, '2026-06-05T06:00:00'), route: '上海市区直达' },
  { id: 'S002', orderId: 'O002', vehicleNo: '云A-66666', driver: '李师傅', departedAt: '2026-06-08T04:00:00', estimatedArrival: '2026-06-09T18:00:00', arrivedAt: null, status: 'in_transit', tempLogs: genTempLogs(25, '2026-06-08T04:00:00'), route: '昆明长途干线' },
  { id: 'S003', orderId: 'O006', vehicleNo: '粤A-55555', driver: '王师傅', departedAt: '2026-06-02T05:30:00', estimatedArrival: '2026-06-02T15:00:00', arrivedAt: '2026-06-02T14:40:00', status: 'completed', tempLogs: genTempLogs(22, '2026-06-02T05:30:00'), route: '广州-深圳城际配送' },
  { id: 'S004', orderId: 'O009', vehicleNo: '川A-77777', driver: '赵师傅', departedAt: '2026-05-25T07:00:00', estimatedArrival: '2026-05-25T11:00:00', arrivedAt: '2026-05-25T10:50:00', status: 'completed', tempLogs: genTempLogs(18, '2026-05-25T07:00:00'), route: '成都市区配送' },
  { id: 'S005', orderId: 'O011', vehicleNo: '沪A-88888', driver: '张师傅', departedAt: '2026-06-07T05:00:00', estimatedArrival: '2026-06-07T10:00:00', arrivedAt: '2026-06-07T09:55:00', status: 'completed', tempLogs: genTempLogs(21, '2026-06-07T05:00:00'), route: '上海市区加急配送' },
  { id: 'S006', orderId: 'O012', vehicleNo: '沪A-99999', driver: '刘师傅', departedAt: '2026-04-03T02:00:00', estimatedArrival: '2026-04-03T08:00:00', arrivedAt: '2026-04-03T07:40:00', status: 'completed', tempLogs: genTempLogs(24, '2026-04-03T02:00:00'), route: '清明高峰加急' },
  { id: 'S007', orderId: 'O013', vehicleNo: '京A-66666', driver: '孙师傅', departedAt: '2026-04-04T01:00:00', estimatedArrival: '2026-04-04T09:00:00', arrivedAt: '2026-04-04T08:50:00', status: 'completed', tempLogs: genTempLogs(28, '2026-04-04T01:00:00'), route: '清明高峰加急' },
  { id: 'S008', orderId: 'O004', vehicleNo: '京A-88888', driver: '周师傅', departedAt: '2026-06-12T04:00:00', estimatedArrival: '2026-06-12T12:00:00', arrivedAt: null, status: 'departed', tempLogs: genTempLogs(8, '2026-06-12T04:00:00'), route: '北京直达' },
  { id: 'S009', orderId: 'O008', vehicleNo: '苏A-55555', driver: '吴师傅', departedAt: '2026-06-20T06:00:00', estimatedArrival: '2026-06-20T14:00:00', arrivedAt: null, status: 'pending', tempLogs: [], route: '南京配送' },
];

export const returns: Return[] = [
  { id: 'R001', orderId: 'O001', customerId: 'C001', reason: '部分花材运输途中受损，花瓣挤压变形', quantity: 500, amount: 1750, processedAt: '2026-06-06T14:30:00', disposal: 'replace' },
  { id: 'R002', orderId: 'O006', customerId: 'C003', reason: '温度控制不当，百合开放度过高', quantity: 300, amount: 2400, processedAt: '2026-06-03T10:15:00', disposal: 'refund' },
  { id: 'R003', orderId: 'O009', customerId: 'C005', reason: '部分菊花存在病害斑点', quantity: 200, amount: 500, processedAt: '2026-05-26T09:00:00', disposal: 'writeoff' },
  { id: 'R004', orderId: 'O011', customerId: 'C001', reason: '数量短缺，少送2扎', quantity: 200, amount: 700, processedAt: '2026-06-08T11:00:00', disposal: 'replace' },
  { id: 'R005', orderId: 'O012', customerId: 'C001', reason: '清明节期间品质不达标，部分花材新鲜度不够', quantity: 1500, amount: 5250, processedAt: '2026-04-05T16:00:00', disposal: 'refund' },
  { id: 'R006', orderId: 'O003', customerId: 'C004', reason: '等级不符合，部分B级混入A级中', quantity: 100, amount: 250, processedAt: '2026-06-10T15:00:00', disposal: 'refund' },
];

const genPriceRecords = (): PriceRecord[] => {
  const records: PriceRecord[] = [];
  const basePrices = {
    chrysanthemum: { A: 3.5, B: 2.5, C: 1.5 },
    lily: { A: 8, B: 6, C: 4 },
  };
  const start = new Date('2025-06-17');
  for (let i = 0; i < 365; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const month = d.getMonth() + 1;
    const isQingming = month === 3 || month === 4;
    const isWinterSolstice = month === 11 || month === 12;
    const seasonalFactor = (isQingming || isWinterSolstice) ? 1.3 + Math.random() * 0.4 : 0.9 + Math.random() * 0.3;
    (['chrysanthemum', 'lily'] as const).forEach(variety => {
      (['A', 'B', 'C'] as const).forEach(grade => {
        const base = basePrices[variety][grade];
        const price = Math.round(base * seasonalFactor * (0.9 + Math.random() * 0.2) * 100) / 100;
        const marketAvg = Math.round(price * (0.95 + Math.random() * 0.1) * 100) / 100;
        records.push({ id: `PR-${dateStr}-${variety}-${grade}`, date: dateStr, variety, grade, price, marketAvg });
      });
    });
  }
  return records;
};

export const priceRecords: PriceRecord[] = genPriceRecords();

export const lossData: LossData[] = [
  { month: '2025-07', planting: 3.2, harvest: 4.1, grading: 2.5, coldChain: 1.8, returns: 0.9 },
  { month: '2025-08', planting: 3.5, harvest: 4.3, grading: 2.7, coldChain: 2.0, returns: 1.1 },
  { month: '2025-09', planting: 2.8, harvest: 3.8, grading: 2.3, coldChain: 1.5, returns: 0.7 },
  { month: '2025-10', planting: 2.5, harvest: 3.5, grading: 2.1, coldChain: 1.3, returns: 0.6 },
  { month: '2025-11', planting: 2.7, harvest: 3.7, grading: 2.2, coldChain: 1.4, returns: 0.8 },
  { month: '2025-12', planting: 3.8, harvest: 5.2, grading: 3.1, coldChain: 2.2, returns: 1.5 },
  { month: '2026-01', planting: 4.0, harvest: 5.5, grading: 3.3, coldChain: 2.4, returns: 1.6 },
  { month: '2026-02', planting: 4.2, harvest: 5.8, grading: 3.5, coldChain: 2.6, returns: 1.8 },
  { month: '2026-03', planting: 4.5, harvest: 6.2, grading: 3.8, coldChain: 2.8, returns: 2.1 },
  { month: '2026-04', planting: 4.8, harvest: 6.5, grading: 4.0, coldChain: 3.0, returns: 2.5 },
  { month: '2026-05', planting: 3.0, harvest: 4.0, grading: 2.6, coldChain: 1.7, returns: 1.0 },
  { month: '2026-06', planting: 2.6, harvest: 3.6, grading: 2.2, coldChain: 1.4, returns: 0.8 },
];

export const monthlyReports: MonthlyReport[] = [
  { month: '2025-07', production: 850000, sales: 720000, inventory: 420000, revenue: 1680000 },
  { month: '2025-08', production: 820000, sales: 690000, inventory: 480000, revenue: 1580000 },
  { month: '2025-09', production: 780000, sales: 680000, inventory: 520000, revenue: 1520000 },
  { month: '2025-10', production: 750000, sales: 700000, inventory: 500000, revenue: 1480000 },
  { month: '2025-11', production: 920000, sales: 810000, inventory: 550000, revenue: 1950000 },
  { month: '2025-12', production: 1250000, sales: 1180000, inventory: 560000, revenue: 2850000 },
  { month: '2026-01', production: 1080000, sales: 920000, inventory: 650000, revenue: 2380000 },
  { month: '2026-02', production: 980000, sales: 850000, inventory: 720000, revenue: 2150000 },
  { month: '2026-03', production: 1580000, sales: 1450000, inventory: 780000, revenue: 3850000 },
  { month: '2026-04', production: 1850000, sales: 1780000, inventory: 800000, revenue: 4520000 },
  { month: '2026-05', production: 1120000, sales: 980000, inventory: 890000, revenue: 2580000 },
  { month: '2026-06', production: 1050000, sales: 880000, inventory: 1020000, revenue: 2420000 },
];

export const festivalForecasts: FestivalForecast[] = [
  {
    festival: '清明节',
    festivalDate: '2026-04-05',
    demandForecast: 2800000,
    availableSupply: 2350000,
    shortage: 450000,
    plantingAdvice: '提前110-120天定植，重点布局白菊、黄菊，占比约70%；辅以多头菊、粉菊。建议分批定植，延长采收窗口，错峰上市。',
    plantingWindow: { start: '2025-12-05', end: '2025-12-25' },
    varieties: [
      { name: '白菊', area: 120 },
      { name: '黄菊', area: 80 },
      { name: '多头菊', area: 40 },
      { name: '粉菊', area: 30 },
      { name: '西伯利亚百合', area: 25 },
    ],
  },
  {
    festival: '冬至',
    festivalDate: '2026-12-21',
    demandForecast: 2500000,
    availableSupply: 2580000,
    shortage: 0,
    plantingAdvice: '提前105-115天定植，冬季低温注意保温措施，建议使用大棚或保温膜。以白菊、黄菊为主，百合为辅。分批定植，确保节前集中采收。',
    plantingWindow: { start: '2026-08-15', end: '2026-09-05' },
    varieties: [
      { name: '白菊', area: 110 },
      { name: '黄菊', area: 70 },
      { name: '多头菊', area: 35 },
      { name: '索邦百合', area: 30 },
      { name: '西伯利亚百合', area: 20 },
    ],
  },
  {
    festival: '春节',
    festivalDate: '2027-02-06',
    demandForecast: 1500000,
    availableSupply: 1320000,
    shortage: 180000,
    plantingAdvice: '提前90-100天定植，冬季需加温设施。以百合为主（象征百年好合），搭配菊花、康乃馨。注意花期调控，确保节日期间盛开。',
    plantingWindow: { start: '2026-10-25', end: '2026-11-15' },
    varieties: [
      { name: '西伯利亚百合', area: 60 },
      { name: '黄天霸百合', area: 40 },
      { name: '多头菊', area: 35 },
      { name: '红康乃馨', area: 25 },
      { name: '卡罗拉玫瑰', area: 20 },
    ],
  },
  {
    festival: '中元节',
    festivalDate: '2026-08-28',
    demandForecast: 980000,
    availableSupply: 1050000,
    shortage: 0,
    plantingAdvice: '提前85-95天定植，夏季高温注意遮阴降温。以白菊、黄菊为主，占比约80%。注意病虫害防治，夏季病虫害高发。',
    plantingWindow: { start: '2026-05-25', end: '2026-06-10' },
    varieties: [
      { name: '白菊', area: 55 },
      { name: '黄菊', area: 35 },
      { name: '粉菊', area: 15 },
      { name: '白色唐菖蒲', area: 10 },
    ],
  },
];

export const initialFields = fields;
export const initialBatches = plantingBatches;
export const initialHarvests = harvests;
export const initialInventory = inventories;
export const initialCustomers = customers;
export const initialOrders = orders;
export const initialShipments = shipments;
export const initialReturns = returns;
export const initialPrices = priceRecords;
export const lossStats = lossData;

