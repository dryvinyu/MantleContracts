"use client";

import { useAccount, useBlockNumber, useChainId } from "wagmi";
import { mantleSepoliaTestnet, mantleMainnet } from "@/lib/wagmi";

export function NetworkStatus() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { data: blockNumber, isLoading } = useBlockNumber({
    watch: true,
    query: {
      refetchInterval: 5000, // Refresh every 5 seconds
    },
  });

  // Get chain info
  const getChainInfo = () => {
    switch (chainId) {
      case mantleSepoliaTestnet.id:
        return {
          name: "Mantle Sepolia",
          color: "bg-purple-500",
          bgColor: "bg-purple-100",
          textColor: "text-purple-700",
          explorerUrl: "https://sepolia.mantlescan.xyz",
        };
      case mantleMainnet.id:
        return {
          name: "Mantle",
          color: "bg-green-500",
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          explorerUrl: "https://mantlescan.xyz",
        };
      default:
        return {
          name: "Unknown",
          color: "bg-gray-500",
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
          explorerUrl: "",
        };
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-600">
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        <span>Not Connected</span>
      </div>
    );
  }

  const chainInfo = getChainInfo();

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 ${chainInfo.bgColor} rounded-full text-sm ${chainInfo.textColor}`}
    >
      {/* Pulsing indicator */}
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${chainInfo.color} opacity-75`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${chainInfo.color}`}
        />
      </span>

      {/* Chain name */}
      <span className="font-medium">{chainInfo.name}</span>

      {/* Block number */}
      {blockNumber && !isLoading && (
        <a
          href={`${chainInfo.explorerUrl}/block/${blockNumber.toString()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs opacity-70 hover:opacity-100 transition-opacity font-mono"
        >
          #{blockNumber.toString()}
        </a>
      )}

      {isLoading && (
        <span className="text-xs opacity-50">
          <svg
            className="animate-spin w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </span>
      )}
    </div>
  );
}
