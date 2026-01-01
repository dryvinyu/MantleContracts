"use client";

import { useState } from "react";
import { useRWATokenInfo, useRWATokenExtendedInfo } from "@/hooks/useContractData";
import { mantleSepoliaTestnet } from "@/lib/wagmi";

interface OnChainDataProps {
  contractAddress: string;
}

export function OnChainData({ contractAddress }: OnChainDataProps) {
  const [copied, setCopied] = useState(false);
  const { assetInfo, isLoading: infoLoading, error: infoError } = useRWATokenInfo(contractAddress);
  const { extendedInfo, isLoading: extendedLoading } = useRWATokenExtendedInfo(contractAddress);

  const isLoading = infoLoading || extendedLoading;
  const isValidAddress = contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000";

  const copyAddress = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = `${mantleSepoliaTestnet.blockExplorers.default.url}/address/${contractAddress}`;

  // Loading state
  if (isLoading && isValidAddress) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // No contract address
  if (!isValidAddress) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 bg-gray-400 rounded-full" />
          <h3 className="text-lg font-semibold">On-Chain Verification</h3>
        </div>
        <p className="text-gray-500 text-sm">
          Contract not yet deployed. Deploy to Mantle Sepolia to enable on-chain verification.
        </p>
      </div>
    );
  }

  // Error state
  if (infoError) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 bg-red-500 rounded-full" />
          <h3 className="text-lg font-semibold">On-Chain Verification</h3>
        </div>
        <p className="text-red-500 text-sm">Failed to fetch contract data. Please check the address.</p>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm mt-2 inline-block"
        >
          View on Explorer →
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <h3 className="text-lg font-semibold">On-Chain Verification</h3>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">
          Live Data
        </span>
      </div>

      {/* Contract Address */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Contract Address</p>
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono bg-gray-100 px-3 py-1.5 rounded flex-1 truncate">
            {contractAddress}
          </code>
          <button
            onClick={copyAddress}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Copy address"
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="View on Explorer"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* On-Chain Data Grid */}
      {assetInfo && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-500 mb-1">Asset Type</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {assetInfo.assetType}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Expected APY</p>
            <p className="font-semibold text-lg text-green-600">
              {assetInfo.expectedAPY.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Risk Score</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    assetInfo.riskScore < 30
                      ? "bg-green-500"
                      : assetInfo.riskScore < 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${assetInfo.riskScore}%` }}
                />
              </div>
              <span className="text-sm font-semibold">{assetInfo.riskScore}/100</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Next Payout</p>
            <p className="text-sm font-medium">
              {assetInfo.nextPayoutDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      )}

      {/* Extended Info */}
      {extendedInfo && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Yield Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${extendedInfo.yieldConfidence}%` }}
                />
              </div>
              <span className="text-sm font-semibold">{extendedInfo.yieldConfidence}/100</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Total AUM</p>
            <p className="font-semibold">
              ${Number(extendedInfo.totalAUM).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Min Investment</p>
            <p className="font-semibold">
              ${Number(extendedInfo.minimumInvestment).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Payouts Made</p>
            <p className="font-semibold">{extendedInfo.payoutCount}</p>
          </div>
        </div>
      )}

      {/* Network Badge */}
      <div className="flex items-center gap-2 pt-4 border-t mt-4">
        <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center">
          <span className="text-white text-[8px] font-bold">M</span>
        </div>
        <span className="text-sm font-medium">Mantle Sepolia Testnet</span>
        <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
          Chain ID: {mantleSepoliaTestnet.id}
        </span>
      </div>
    </div>
  );
}
