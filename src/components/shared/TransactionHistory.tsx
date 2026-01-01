"use client";

import { useRecentDistributions, useTokenDistributionStats } from "@/hooks/useContractData";
import { mantleSepoliaTestnet } from "@/lib/wagmi";

interface TransactionHistoryProps {
  distributorAddress?: string;
  tokenAddress?: string;
}

export function TransactionHistory({
  distributorAddress,
  tokenAddress,
}: TransactionHistoryProps) {
  const {
    distributions,
    isLoading: distLoading,
  } = useRecentDistributions(distributorAddress, tokenAddress, 10);

  const {
    stats,
    isLoading: statsLoading,
  } = useTokenDistributionStats(distributorAddress, tokenAddress);

  const isLoading = distLoading || statsLoading;
  const hasData = distributorAddress && tokenAddress;

  // Loading state
  if (isLoading && hasData) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Distribution History</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No data state
  if (!hasData) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Distribution History</h3>
        <p className="text-gray-500 text-sm text-center py-8">
          Connect wallet to view distribution history
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Distribution History</h3>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">Total Distributed</p>
            <p className="text-xl font-bold text-green-600">
              ${Number(stats.totalDistributed).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Distributions Made</p>
            <p className="text-xl font-bold">{stats.distributionCount}</p>
          </div>
        </div>
      )}

      {/* Distributions Table */}
      {distributions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          No distributions yet
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Recipients</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {distributions.map((dist, index) => (
                <tr key={index} className="text-sm hover:bg-gray-50">
                  <td className="py-3">
                    <div>
                      <p className="font-medium">
                        {dist.timestamp.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {dist.timestamp.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="font-mono font-medium text-green-600">
                      ${Number(dist.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="text-gray-600">{dist.recipientCount}</span>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View All Link */}
      {distributions.length > 0 && (
        <div className="mt-4 pt-4 border-t text-center">
          <a
            href={`${mantleSepoliaTestnet.blockExplorers.default.url}/address/${distributorAddress}#events`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
          >
            View all on Explorer
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
