// ============================================
// Mantle RealFi Console - Contract Types
// ============================================

// ============ Asset Types ============

/** 资产类别 (匹配前端界面) */
export type AssetType = "Bonds" | "RealEstate" | "Invoices" | "CashFlow";

/** 风险等级 */
export type RiskLevel = "Low" | "Medium" | "High";

/** 分配类型 */
export type DistributionType = "Monthly" | "Quarterly" | "Maturity" | "Scheduled";

/** 资产状态 (匹配合约 enum) */
export type AssetStatus = "Active" | "Maturing" | "Matured" | "Paused";

/** 状态枚举值 */
export const AssetStatusEnum = {
  Active: 0,
  Maturing: 1,
  Matured: 2,
  Paused: 3,
} as const;

// ============ RWAToken Types ============

/** 资产基本信息 (getAssetInfo 返回) */
export interface AssetInfo {
  /** 资产类型 */
  assetType: AssetType;
  /** 预期年化收益率 (百分比, 如 5.20) */
  expectedAPY: number;
  /** 风险评分 (0-100) */
  riskScore: number;
  /** 锁定期 (秒) */
  duration: number;
  /** 下次分红日期 */
  nextPayoutDate: Date;
  /** 资产状态 */
  status: AssetStatus;
}

/** 资产扩展信息 (getExtendedInfo 返回) */
export interface ExtendedInfo {
  /** 收益置信度 (0-100) */
  yieldConfidence: number;
  /** 总管理资产 (USD) */
  totalAUM: number;
  /** 最低投资额 (USD) */
  minimumInvestment: number;
  /** 历史分红次数 */
  payoutCount: number;
  /** 到期日期 */
  maturityDate: Date;
}

/** 用户投资信息 (getUserInvestment 返回) */
export interface UserInvestment {
  /** 持有余额 */
  balance: number;
  /** 投资时间 */
  investmentTime: Date;
  /** 投资金额 */
  investmentAmount: number;
  /** 是否可赎回 */
  canRedeem: boolean;
}

/** 收益组件 (Yield Breakdown) */
export interface YieldComponent {
  /** 组件名称 */
  name: string;
  /** 值 (百分比, 可为负数表示费用) */
  value: number;
  /** 描述 */
  description: string;
}

/** 分红记录 */
export interface PayoutRecord {
  /** 分红日期 */
  date: Date;
  /** 分红金额 (USD) */
  amount: number;
  /** 接收人数 */
  recipientCount: number;
}

/** 完整资产数据 */
export interface FullAssetData extends AssetInfo, ExtendedInfo {
  /** 合约地址 */
  contractAddress: string;
  /** 代币名称 */
  name: string;
  /** 代币符号 */
  symbol: string;
  /** 收益组件列表 */
  yieldComponents: YieldComponent[];
  /** 净收益率 (计算值) */
  netAPY: number;
  /** 锁定期 (天) */
  durationDays: number;
  /** 风险等级 (计算值) */
  riskLevel: RiskLevel;
}

// ============ YieldDistributor Types ============

/** 分配记录 */
export interface Distribution {
  /** RWA 代币地址 */
  token: string;
  /** 总分配金额 (USD) */
  totalAmount: number;
  /** 接收人数 */
  recipientCount: number;
  /** 分配时间 */
  timestamp: Date;
  /** 分配类型 */
  distributionType: DistributionType;
}

/** 预约分配 */
export interface ScheduledDistribution {
  /** 预约 ID */
  scheduleId: number;
  /** RWA 代币地址 */
  token: string;
  /** 预约金额 (USD) */
  amount: number;
  /** 预定执行日期 */
  scheduledDate: Date;
  /** 是否已执行 */
  executed: boolean;
}

/** 代币分配统计 */
export interface TokenDistributionStats {
  /** 累计分配总额 (USD) */
  totalDistributed: number;
  /** 分配次数 */
  distributionCount: number;
  /** 平均每次分配金额 */
  averageAmount: number;
  /** 最后一次分配时间 */
  lastDistribution: Date | null;
}

// ============ API Response Types ============

/** API 响应基类 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** 资产列表响应 */
export interface AssetsListResponse {
  assets: FullAssetData[];
  total: number;
}

/** 资产详情响应 */
export interface AssetDetailResponse {
  asset: FullAssetData;
  userBalance?: number;
  distributions?: Distribution[];
}

/** 分配历史响应 */
export interface DistributionHistoryResponse {
  distributions: Distribution[];
  stats: TokenDistributionStats;
}

// ============ Filter & Sort Types ============

/** 资产筛选条件 */
export interface AssetFilters {
  /** 资产类型 */
  types?: AssetType[];
  /** APY 范围 */
  apyRange?: { min: number; max: number };
  /** 风险等级 */
  riskLevels?: RiskLevel[];
  /** 置信度范围 */
  confidenceRange?: { min: number; max: number };
  /** 最低投资额上限 */
  maxMinInvestment?: number;
}

/** 排序字段 */
export type AssetSortField =
  | "name"
  | "apy"
  | "riskScore"
  | "yieldConfidence"
  | "totalAUM"
  | "nextPayoutDate";

/** 排序方向 */
export type SortDirection = "asc" | "desc";

/** 排序配置 */
export interface AssetSort {
  field: AssetSortField;
  direction: SortDirection;
}

// ============ Chart Data Types ============

/** 收益分解图表数据 */
export interface YieldBreakdownChartData {
  name: string;
  value: number;
  color: string;
  description: string;
}

/** 资产配置图表数据 */
export interface AllocationChartData {
  assetType: AssetType;
  percentage: number;
  value: number;
  color: string;
}

/** 资产类型颜色映射 */
export const AssetTypeColors: Record<AssetType, string> = {
  Bonds: "#3B82F6",      // Blue
  RealEstate: "#8B5CF6", // Purple
  Invoices: "#F59E0B",   // Amber
  CashFlow: "#10B981",   // Green
};

/** 资产类型显示名称 */
export const AssetTypeLabels: Record<AssetType, string> = {
  Bonds: "Bonds",
  RealEstate: "Real Estate",
  Invoices: "Invoices",
  CashFlow: "Cash Flow",
};

/** 历史收益图表数据 */
export interface HistoricalYieldData {
  date: string;
  apy: number;
  realized: number;
  projected: number;
}

/** 分配历史图表数据 */
export interface DistributionChartData {
  date: string;
  amount: number;
  recipients: number;
}

// ============ Portfolio Types ============

/** 用户持仓 */
export interface UserPosition {
  /** 资产 ID */
  assetId: string;
  /** 合约地址 */
  contractAddress: string;
  /** 持仓金额 (USD) */
  amount: number;
  /** 持有代币数量 */
  shares: number;
  /** 入场价格 */
  entryPrice: number;
  /** 入场日期 */
  entryDate: Date;
  /** 累计收益 */
  accruedYield: number;
  /** 持仓状态 */
  status: "Active" | "Locked" | "Matured";
}

/** 用户投资组合 */
export interface UserPortfolio {
  /** 用户 ID */
  userId: string;
  /** 总资产 (USD) */
  totalAUM: number;
  /** 加权 APY */
  weightedAPY: number;
  /** 组合风险评分 */
  riskScore: number;
  /** 持仓列表 */
  positions: UserPosition[];
  /** 资产配置比例 */
  allocation: Record<AssetType, number>;
  /** 下次分红时间 */
  nextPayout: Date | null;
}

// ============ Transaction Types ============

/** 交易类型 */
export type TransactionType = "Buy" | "Sell" | "Yield" | "Transfer";

/** 交易状态 */
export type TransactionStatus = "Pending" | "Completed" | "Failed";

/** 交易记录 */
export interface Transaction {
  /** 交易 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 资产 ID */
  assetId: string;
  /** 交易类型 */
  type: TransactionType;
  /** 金额 (USD) */
  amount: number;
  /** 代币数量 */
  shares: number;
  /** 价格 */
  price: number;
  /** 交易时间 */
  timestamp: Date;
  /** 链上交易哈希 */
  txHash: string;
  /** 交易状态 */
  status: TransactionStatus;
}
