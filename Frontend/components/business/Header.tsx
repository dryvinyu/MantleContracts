'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Wallet, ChevronDown, ExternalLink, Network } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useWallet } from '@/lib/hooks/useWallet'
import {
  getExplorerUrl,
  getNetworkName,
  defaultChain,
} from '@/lib/config/networks'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function TopBar() {
  const {
    isConnected,
    address,
    chainId,
    connect,
    disconnect,
    switchNetwork,
    addNetwork,
  } = useWallet()
  const [isSwitching, setIsSwitching] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Use default chain ID for SSR, actual chainId only after mount
  const effectiveChainId = isMounted
    ? (chainId ?? defaultChain.id)
    : defaultChain.id

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Only check wrong network after mount to prevent hydration mismatch
  const isWrongNetwork =
    isMounted &&
    isConnected &&
    effectiveChainId !== 5000 &&
    effectiveChainId !== 5003

  const handleSwitchNetwork = async (targetChainId: number) => {
    setIsSwitching(true)
    try {
      await switchNetwork(targetChainId)
    } catch (error) {
      // Error handling is done in WalletProvider
    } finally {
      setIsSwitching(false)
    }
  }

  const handleAddNetwork = async (targetChainId: number) => {
    setIsSwitching(true)
    try {
      await addNetwork(targetChainId)
    } catch (error) {
      // Error handling is done in WalletProvider
    } finally {
      setIsSwitching(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-xl">
      <div className="h-16 flex items-center justify-between px-6">
        {/* Logo and Nav */}
        <div className="flex items-center gap-6">
          <Link href="/">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-primary/20 blur" />
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-white font-bold text-sm">MR</span>
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm uppercase tracking-[0.3em] text-slate-500">
                  Mantle
                </span>
                <span className="text-lg font-semibold text-slate-900">
                  RealFi Console
                </span>
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>

        {/* Network Status */}
        <div className="flex items-center gap-2 text-sm">
          {isWrongNetwork && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/15 rounded-full border border-amber-500/40">
              <span className="text-amber-300 text-xs font-medium">
                Wrong Network
              </span>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-full cursor-pointer hover:bg-white transition-colors shadow-[0_6px_20px_-14px_rgba(59,130,246,0.35)]">
                <span
                  className={`w-2 h-2 rounded-full ${isMounted && isConnected ? 'bg-emerald-400' : 'bg-muted-foreground'}`}
                />
                <span className="text-slate-600 text-xs uppercase tracking-[0.2em]">
                  {getNetworkName(effectiveChainId)}
                </span>
                {isMounted && isConnected && (
                  <span className="text-slate-500 text-xs">
                    #{effectiveChainId}
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-600" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => handleSwitchNetwork(5000)}
                disabled={effectiveChainId === 5000 || isSwitching}
              >
                <Network className="w-4 h-4 mr-2" />
                Mantle Mainnet
                {effectiveChainId === 5000 && (
                  <span className="ml-auto text-xs">OK</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSwitchNetwork(5003)}
                disabled={effectiveChainId === 5003 || isSwitching}
              >
                <Network className="w-4 h-4 mr-2" />
                Mantle Testnet
                {effectiveChainId === 5003 && (
                  <span className="ml-auto text-xs">OK</span>
                )}
              </DropdownMenuItem>
              {isWrongNetwork && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleAddNetwork(5000)}
                    disabled={isSwitching}
                    className="text-yellow-500"
                  >
                    Add Mantle Mainnet
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAddNetwork(5003)}
                    disabled={isSwitching}
                    className="text-yellow-500"
                  >
                    Add Mantle Testnet
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Wallet */}
        <div>
          {isMounted && isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="default"
                  className="gap-2 cursor-pointer shadow-[0_10px_30px_-20px_rgba(59,130,246,0.4)]"
                >
                  <Wallet className="w-4 h-4" />
                  {formatAddress(address!)}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      getExplorerUrl(effectiveChainId, address || undefined),
                      '_blank',
                    )
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={disconnect}
                  className="text-destructive"
                >
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              onClick={connect}
              variant="default"
              className="gap-2 cursor-pointer !bg-blue-600 !text-white hover:!bg-blue-700"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
