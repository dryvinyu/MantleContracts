'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bot, History, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'

import PortfolioHoldings from './components/PortfolioHoldings'
import PortfolioSummary from './components/PortfolioSummary'
import RWABalanceCard from '@/components/RWABalanceCard'
import CopilotDrawer from '@/components/CopilotDrawer'
import { Button } from '@/components/ui/button'
import useCopilot from '@/lib/hooks/useCopilot'

export default function DashboardPage() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false)
  const { sendMessage, generateRebalancePlan } = useCopilot()

  const handleAskAI = () => {
    setIsCopilotOpen(true)
    sendMessage('Explain my portfolio risk')
  }

  const handleRebalance = () => {
    setIsCopilotOpen(true)
    generateRebalancePlan()
  }

  const handleExportReport = () => {
    toast.success('Report exported', {
      description: 'A demo portfolio report was generated for download.',
    })
  }

  return (
    <section className="h-full flex flex-col lg:flex-row">
      <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border p-4 overflow-y-auto scrollbar-thin space-y-4">
        <RWABalanceCard />
        <PortfolioSummary />
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wider">
            Quick Actions
          </h3>
          <Link href="/">
            <Button variant="outline" className="w-full justify-start">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Browse Marketplace
            </Button>
          </Link>
          <Link href="/dashboard/transactions">
            <Button variant="outline" className="w-full justify-start">
              <History className="w-4 h-4 mr-2" />
              Transaction History
            </Button>
          </Link>
          <Button
            onClick={handleAskAI}
            variant="outline"
            className="w-full justify-start"
          >
            Ask AI
          </Button>
          <Button
            onClick={handleRebalance}
            variant="outline"
            className="w-full justify-start"
          >
            Rebalance
          </Button>
          <Button
            onClick={handleExportReport}
            variant="outline"
            className="w-full justify-start"
          >
            Export Report
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <PortfolioHoldings />
      </main>

      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      {!isCopilotOpen && (
        <Button
          onClick={() => setIsCopilotOpen(true)}
          className="fixed right-6 bottom-6 h-12 w-12 rounded-full shadow-lg"
        >
          <Bot className="w-5 h-5" />
        </Button>
      )}
    </section>
  )
}
