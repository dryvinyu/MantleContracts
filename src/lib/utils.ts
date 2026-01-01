// ============================================
// Mantle RealFi Console - Utility Functions
// ============================================

import { formatUnits, parseUnits } from "viem";
import type { AssetType, RiskLevel } from "@/types/contracts";

// ============ Number Conversions ============

/**
 * 基点转百分比
 * @param bp 基点值 (520 = 5.20%)
 * @returns 百分比值 (5.20)
 */
export function basisPointsToPercent(bp: number | bigint): number {
  return Number(bp) / 100;
}

/**
 * 百分比转基点
 * @param percent 百分比值 (5.20)
 * @returns 基点值 (520)
 */
export function percentToBasisPoints(percent: number): bigint {
  return BigInt(Math.round(percent * 100));
}

/**
 * Wei 转 USD (18位精度)
 * @param wei Wei 值
 * @returns USD 数值
 */
export function weiToUSD(wei: bigint): number {
  return parseFloat(formatUnits(wei, 18));
}

/**
 * USD 转 Wei
 * @param usd USD 数值
 * @returns Wei 值
 */
export function usdToWei(usd: number): bigint {
  return parseUnits(usd.toString(), 18);
}

/**
 * 秒转天
 * @param seconds 秒数
 * @returns 天数
 */
export function secondsToDays(seconds: number): number {
  return Math.floor(seconds / 86400);
}

/**
 * 天转秒
 * @param days 天数
 * @returns 秒数
 */
export function daysToSeconds(days: number): number {
  return days * 86400;
}

/**
 * 秒转人类可读格式
 * @param seconds 秒数
 * @returns 格式化字符串 (如 "6 months", "1 year")
 */
export function secondsToHumanReadable(seconds: number): string {
  const days = secondsToDays(seconds);

  if (days === 0) return "Flexible";
  if (days < 30) return `${days} days`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month" : `${months} months`;
  }

  const years = Math.floor(days / 365);
  return years === 1 ? "1 year" : `${years} years`;
}

// ============ Formatting ============

/**
 * 格式化 APY 显示
 * @param apy APY 百分比值
 * @returns 格式化字符串 (如 "5.20%")
 */
export function formatAPY(apy: number): string {
  return `${apy.toFixed(2)}%`;
}

/**
 * 格式化 USD 金额
 * @param amount 金额数值
 * @param options 格式化选项
 * @returns 格式化字符串 (如 "$1,234.56")
 */
export function formatUSD(
  amount: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    compact?: boolean;
  }
): string {
  const { minimumFractionDigits = 0, maximumFractionDigits = 2, compact = false } = options || {};

  if (compact && amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (compact && amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * 格式化大数字 (带 K/M/B 后缀)
 * @param num 数值
 * @returns 格式化字符串
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * 格式化日期
 * @param date 日期对象
 * @param format 格式类型
 * @returns 格式化字符串
 */
export function formatDate(
  date: Date,
  format: "short" | "long" | "relative" = "short"
): string {
  if (format === "relative") {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days === -1) return "Yesterday";
    if (days > 0 && days < 7) return `In ${days} days`;
    if (days < 0 && days > -7) return `${Math.abs(days)} days ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: format === "long" ? "long" : "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * 格式化倒计时
 * @param targetDate 目标日期
 * @returns 倒计时字符串 (如 "31 days")
 */
export function formatCountdown(targetDate: Date): string {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) return "Now";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  return `${hours} hour${hours > 1 ? "s" : ""}`;
}

// ============ Risk Assessment ============

/**
 * 风险评分转等级
 * @param score 风险评分 (0-100)
 * @returns 风险等级
 */
export function riskScoreToLevel(score: number): RiskLevel {
  if (score < 30) return "Low";
  if (score < 60) return "Medium";
  return "High";
}

/**
 * 获取风险等级颜色类名
 * @param level 风险等级
 * @returns Tailwind CSS 类名
 */
export function riskLevelColor(level: RiskLevel): string {
  switch (level) {
    case "Low":
      return "text-green-600 bg-green-100 border-green-200";
    case "Medium":
      return "text-yellow-600 bg-yellow-100 border-yellow-200";
    case "High":
      return "text-red-600 bg-red-100 border-red-200";
  }
}

/**
 * 获取风险等级背景色
 * @param level 风险等级
 * @returns 颜色代码
 */
export function riskLevelBgColor(level: RiskLevel): string {
  switch (level) {
    case "Low":
      return "#10B981";
    case "Medium":
      return "#F59E0B";
    case "High":
      return "#EF4444";
  }
}

// ============ Asset Type Helpers ============

/**
 * 获取资产类型颜色
 * @param type 资产类型
 * @returns 颜色代码
 */
export function assetTypeColor(type: AssetType): string {
  switch (type) {
    case "Bonds":
      return "#3B82F6"; // Blue
    case "RealEstate":
      return "#8B5CF6"; // Purple
    case "Invoices":
      return "#F59E0B"; // Amber
    case "CashFlow":
      return "#10B981"; // Green
    default:
      return "#6B7280"; // Gray fallback
  }
}

/**
 * 获取资产类型图标名称
 * @param type 资产类型
 * @returns 图标名称
 */
export function assetTypeIcon(type: AssetType): string {
  switch (type) {
    case "Bonds":
      return "TrendingUp";
    case "RealEstate":
      return "Building";
    case "Invoices":
      return "FileText";
    case "CashFlow":
      return "DollarSign";
    default:
      return "Circle";
  }
}

/**
 * 获取资产类型显示名称
 * @param type 资产类型
 * @returns 显示名称
 */
export function assetTypeDisplayName(type: AssetType): string {
  switch (type) {
    case "Bonds":
      return "Bonds";
    case "RealEstate":
      return "Real Estate";
    case "Invoices":
      return "Invoices";
    case "CashFlow":
      return "Cash Flow";
    default:
      return type;
  }
}

// ============ Address Helpers ============

/**
 * 缩短地址显示
 * @param address 完整地址
 * @param chars 前后保留字符数
 * @returns 缩短的地址 (如 "0x1234...5678")
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * 验证以太坊地址格式
 * @param address 地址字符串
 * @returns 是否有效
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * 检查是否为零地址
 * @param address 地址字符串
 * @returns 是否为零地址
 */
export function isZeroAddress(address: string): boolean {
  return address === "0x0000000000000000000000000000000000000000";
}

// ============ Calculation Helpers ============

/**
 * 计算加权平均 APY
 * @param positions 持仓数组 [{amount, apy}]
 * @returns 加权 APY
 */
export function calculateWeightedAPY(
  positions: { amount: number; apy: number }[]
): number {
  const totalAmount = positions.reduce((sum, p) => sum + p.amount, 0);
  if (totalAmount === 0) return 0;

  const weightedSum = positions.reduce((sum, p) => sum + p.amount * p.apy, 0);
  return weightedSum / totalAmount;
}

/**
 * 计算组合风险评分
 * @param positions 持仓数组 [{amount, riskScore}]
 * @returns 加权风险评分
 */
export function calculatePortfolioRisk(
  positions: { amount: number; riskScore: number }[]
): number {
  const totalAmount = positions.reduce((sum, p) => sum + p.amount, 0);
  if (totalAmount === 0) return 0;

  const weightedSum = positions.reduce((sum, p) => sum + p.amount * p.riskScore, 0);
  return Math.round(weightedSum / totalAmount);
}

/**
 * 计算预期年化收益
 * @param principal 本金
 * @param apy APY 百分比
 * @returns 预期收益
 */
export function calculateExpectedReturn(principal: number, apy: number): number {
  return principal * (apy / 100);
}

/**
 * 计算资产配置比例
 * @param positions 持仓数组 [{amount, assetType}]
 * @returns 各类型占比
 */
export function calculateAllocation(
  positions: { amount: number; assetType: AssetType }[]
): Record<AssetType, number> {
  const totalAmount = positions.reduce((sum, p) => sum + p.amount, 0);
  if (totalAmount === 0) {
    return { Bonds: 0, RealEstate: 0, Invoices: 0, CashFlow: 0 };
  }

  const allocation: Record<AssetType, number> = {
    Bonds: 0,
    RealEstate: 0,
    Invoices: 0,
    CashFlow: 0,
  };

  for (const position of positions) {
    allocation[position.assetType] += (position.amount / totalAmount) * 100;
  }

  return allocation;
}

// ============ Status Helpers ============

import type { AssetStatus } from "@/types/contracts";

/**
 * 获取状态颜色类名
 * @param status 资产状态
 * @returns Tailwind CSS 类名
 */
export function statusColor(status: AssetStatus): string {
  switch (status) {
    case "Active":
      return "text-green-600 bg-green-100";
    case "Maturing":
      return "text-yellow-600 bg-yellow-100";
    case "Matured":
      return "text-blue-600 bg-blue-100";
    case "Paused":
      return "text-gray-600 bg-gray-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

/**
 * 格式化 Duration 显示
 * @param seconds 秒数
 * @returns 格式化字符串 (如 "2.0Y", "180D", "1Y")
 */
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);

  if (days === 0) return "Flexible";
  if (days < 90) return `${days}D`;
  if (days < 365) return `${days}D`;

  const years = days / 365;
  if (years >= 1) {
    return years % 1 === 0 ? `${years}Y` : `${years.toFixed(1)}Y`;
  }

  return `${days}D`;
}

// ============ Validation Helpers ============

/**
 * 验证投资金额
 * @param amount 投资金额
 * @param min 最小金额
 * @param max 最大金额 (可选)
 * @returns 验证结果
 */
export function validateInvestmentAmount(
  amount: number,
  min: number,
  max?: number
): { valid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: "Please enter a valid amount" };
  }
  if (amount < min) {
    return { valid: false, error: `Minimum investment is ${formatUSD(min)}` };
  }
  if (max && amount > max) {
    return { valid: false, error: `Maximum investment is ${formatUSD(max)}` };
  }
  return { valid: true };
}

// ============ Explorer Links ============

/**
 * 获取区块浏览器地址链接
 * @param address 地址
 * @param chainId 链 ID
 * @returns 浏览器 URL
 */
export function getExplorerAddressUrl(address: string, chainId: number = 5003): string {
  const baseUrl = chainId === 5000
    ? "https://mantlescan.xyz"
    : "https://sepolia.mantlescan.xyz";
  return `${baseUrl}/address/${address}`;
}

/**
 * 获取区块浏览器交易链接
 * @param txHash 交易哈希
 * @param chainId 链 ID
 * @returns 浏览器 URL
 */
export function getExplorerTxUrl(txHash: string, chainId: number = 5003): string {
  const baseUrl = chainId === 5000
    ? "https://mantlescan.xyz"
    : "https://sepolia.mantlescan.xyz";
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * 获取区块浏览器区块链接
 * @param blockNumber 区块号
 * @param chainId 链 ID
 * @returns 浏览器 URL
 */
export function getExplorerBlockUrl(blockNumber: number, chainId: number = 5003): string {
  const baseUrl = chainId === 5000
    ? "https://mantlescan.xyz"
    : "https://sepolia.mantlescan.xyz";
  return `${baseUrl}/block/${blockNumber}`;
}

// ============ Class Name Helpers ============

/**
 * 合并 class 名称 (类似 clsx)
 * @param classes 类名数组
 * @returns 合并后的类名字符串
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
