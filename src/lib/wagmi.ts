import { http, createConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected, metaMask, walletConnect } from "wagmi/connectors";

// Define Mantle Sepolia Testnet
export const mantleSepoliaTestnet = {
  id: 5003,
  name: "Mantle Sepolia Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "MNT",
    symbol: "MNT",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.sepolia.mantle.xyz"],
    },
    public: {
      http: ["https://rpc.sepolia.mantle.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mantle Sepolia Explorer",
      url: "https://sepolia.mantlescan.xyz",
    },
  },
  testnet: true,
} as const;

// Define Mantle Mainnet
export const mantleMainnet = {
  id: 5000,
  name: "Mantle",
  nativeCurrency: {
    decimals: 18,
    name: "MNT",
    symbol: "MNT",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.mantle.xyz"],
    },
    public: {
      http: ["https://rpc.mantle.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mantle Explorer",
      url: "https://mantlescan.xyz",
    },
  },
  testnet: false,
} as const;

// WalletConnect Project ID - Replace with your own for production
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";

export const config = createConfig({
  chains: [mantleSepoliaTestnet, mantleMainnet, mainnet],
  connectors: [
    injected(),
    metaMask(),
    ...(projectId !== "demo"
      ? [
          walletConnect({
            projectId,
            metadata: {
              name: "Mantle RealFi Console",
              description: "RWA Portfolio Management Platform",
              url: "https://mantle-realfi.vercel.app",
              icons: ["https://mantle.xyz/logo.png"],
            },
          }),
        ]
      : []),
  ],
  transports: {
    [mantleSepoliaTestnet.id]: http("https://rpc.sepolia.mantle.xyz"),
    [mantleMainnet.id]: http("https://rpc.mantle.xyz"),
    [mainnet.id]: http(),
  },
});

// Export chain info for easy access
export const SUPPORTED_CHAINS = {
  MANTLE_SEPOLIA: mantleSepoliaTestnet,
  MANTLE_MAINNET: mantleMainnet,
};

export const DEFAULT_CHAIN = mantleSepoliaTestnet;
