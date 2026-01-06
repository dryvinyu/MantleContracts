'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  recommendations?: {
    action: string
    reason: string
  }[]
  riskNotes?: string
}

export interface RebalancePlan {
  id: string
  actions: {
    type: 'buy' | 'sell'
    assetId: string
    assetName: string
    shares: number
    value: number
  }[]
  currentAPY: number
  projectedAPY: number
  currentRisk: number
  projectedRisk: number
  createdAt: Date
}

interface CopilotContextType {
  messages: Message[]
  rebalancePlan: RebalancePlan | null
  isLoading: boolean
  selectedContext: 'portfolio' | string
  setSelectedContext: (context: 'portfolio' | string) => void
  sendMessage: (content: string) => void
  generateRebalancePlan: () => void
  clearMessages: () => void
}

export const CopilotContext = createContext<CopilotContextType | undefined>(
  undefined,
)

export default function CopilotProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [rebalancePlan, setRebalancePlan] = useState<RebalancePlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedContext, setSelectedContext] = useState<'portfolio' | string>(
    'portfolio',
  )

  const sendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    fetch('/api/ai/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: selectedContext,
        question: content,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Copilot request failed')
        }
        return res.json()
      })
      .then((response) => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.summary,
          timestamp: new Date(),
          recommendations: response.recommendations,
          riskNotes: response.riskNotes,
        }
        setMessages((prev) => [...prev, assistantMessage])
      })
      .catch(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Copilot is temporarily unavailable. Please try again.',
            timestamp: new Date(),
          },
        ])
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const generateRebalancePlan = () => {
    setIsLoading(true)
    setTimeout(() => {
      setRebalancePlan({
        id: Date.now().toString(),
        actions: [
          {
            type: 'sell',
            assetId: 'cf-saas-01',
            assetName: 'SaaS Revenue Pool',
            shares: 8,
            value: 2000,
          },
          {
            type: 'sell',
            assetId: 'inv-factoring-01',
            assetName: 'Supply Chain Factoring',
            shares: 30,
            value: 3000,
          },
          {
            type: 'buy',
            assetId: 'bond-treasury-01',
            assetName: 'US Treasury 2Y Tokenized',
            shares: 40,
            value: 4000,
          },
          {
            type: 'buy',
            assetId: 'bond-corp-02',
            assetName: 'Investment Grade Corporate',
            shares: 10,
            value: 1000,
          },
        ],
        currentAPY: 7.8,
        projectedAPY: 6.2,
        currentRisk: 28,
        projectedRisk: 18,
        createdAt: new Date(),
      })
      setIsLoading(false)
    }, 2000)
  }

  const clearMessages = () => {
    setMessages([])
    setRebalancePlan(null)
  }

  return (
    <CopilotContext.Provider
      value={{
        messages,
        rebalancePlan,
        isLoading,
        selectedContext,
        setSelectedContext,
        sendMessage,
        generateRebalancePlan,
        clearMessages,
      }}
    >
      {children}
    </CopilotContext.Provider>
  )
}

export const useCopilotContext = () => {
  const context = useContext(CopilotContext)
  if (!context) {
    throw new Error('useCopilotContext must be used within a CopilotProvider')
  }
  return context
}
