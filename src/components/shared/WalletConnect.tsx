"use client";

import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { useState } from "react";
import { mantleSepoliaTestnet } from "@/lib/wagmi";

export function WalletConnect() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const [isOpen, setIsOpen] = useState(false);

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Check if on correct network
  const isCorrectNetwork = chainId === mantleSepoliaTestnet.id;

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {/* Network indicator */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
            isCorrectNetwork
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isCorrectNetwork ? "bg-green-500" : "bg-yellow-500"
            }`}
          />
          {isCorrectNetwork ? "Mantle Sepolia" : "Wrong Network"}
        </div>

        {/* Address display */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
          <span className="text-sm font-mono">{formatAddress(address)}</span>
          <button
            onClick={() => navigator.clipboard.writeText(address)}
            className="text-gray-500 hover:text-gray-700"
            title="Copy address"
          >
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
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>

        {/* Disconnect button */}
        <button
          onClick={() => disconnect()}
          className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isConnecting}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isConnecting ? (
          <>
            <svg
              className="animate-spin w-4 h-4"
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Connecting...
          </>
        ) : (
          <>
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
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Connect Wallet
          </>
        )}
      </button>

      {/* Connector dropdown */}
      {isOpen && !isConnecting && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-2">
            <div className="text-xs text-gray-500 px-3 py-2">
              Select wallet
            </div>
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => {
                  connect({ connector });
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {connector.name === "MetaMask" && (
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                    alt="MetaMask"
                    className="w-5 h-5"
                  />
                )}
                {connector.name === "Injected" && (
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                )}
                {connector.name === "WalletConnect" && (
                  <svg
                    className="w-5 h-5 text-blue-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M4.913 7.519c3.915-3.831 10.26-3.831 14.175 0l.47.461a.483.483 0 010 .694l-1.61 1.577a.254.254 0 01-.354 0l-.649-.635c-2.73-2.673-7.157-2.673-9.887 0l-.694.68a.254.254 0 01-.354 0L4.4 8.72a.483.483 0 010-.694l.513-.508zm17.507 3.263l1.434 1.404a.483.483 0 010 .694l-6.466 6.331a.508.508 0 01-.708 0l-4.588-4.493a.127.127 0 00-.177 0l-4.588 4.493a.508.508 0 01-.708 0L.153 12.88a.483.483 0 010-.694l1.434-1.404a.508.508 0 01.708 0l4.588 4.493a.127.127 0 00.177 0l4.588-4.493a.508.508 0 01.708 0l4.588 4.493a.127.127 0 00.177 0l4.588-4.493a.508.508 0 01.708 0z" />
                  </svg>
                )}
                <span>{connector.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute right-0 mt-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 max-w-xs">
          {error.message}
        </div>
      )}
    </div>
  );
}
