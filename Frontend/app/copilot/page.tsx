'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  ChevronDown,
  RefreshCw,
  Send,
  User,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import useCopilot from '@/lib/hooks/useCopilot'
import { type Asset } from '@/lib/mockData'
import type { Message } from '@/lib/providers/CopilotProvider'

const presetPrompts = [
  { label: 'Explain portfolio risk', prompt: 'Explain my portfolio risk' },
  {
    label: 'Conservative 6% target',
    prompt:
      'I prefer conservative allocation, target 6% annual yield, how should I adjust?',
  },
  {
    label: 'Earliest payouts',
    prompt: 'Which assets have the earliest next payout?',
  },
  {
    label: '90-day allocation plan',
    prompt: 'Give me a 90-day touring allocation suggestion',
  },
]

export default function CopilotPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    messages,
    rebalancePlan,
    isLoading,
    selectedContext,
    setSelectedContext,
    sendMessage,
    generateRebalancePlan,
    clearMessages,
  } = useCopilot()
  const [input, setInput] = useState('')
  const [assets, setAssets] = useState<Asset[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch assets from API
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('/api/assets')
        if (response.ok) {
          const data = await response.json()
          setAssets(data.assets || [])
        }
      } catch (error) {
        console.error('Failed to fetch assets:', error)
      }
    }
    fetchAssets()
  }, [])

  useEffect(() => {
    const assetId = searchParams.get('asset')
    if (assetId) {
      setSelectedContext(assetId)
    }
  }, [searchParams, setSelectedContext])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
  }

  const handlePreset = (prompt: string) => {
    sendMessage(prompt)
  }

  const getContextLabel = () => {
    if (selectedContext === 'portfolio') return 'Full Portfolio'
    const asset = assets.find((a) => a.id === selectedContext)
    return asset?.name || 'Select Context'
  }

  return (
    <div className="h-full flex flex-col lg:flex-row">
      <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-border p-4 flex flex-col">
        <h2 className="text-sm font-medium text-slate-600 uppercase tracking-wider mb-4">
          Context
        </h2>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {getContextLabel()}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={() => setSelectedContext('portfolio')}>
              Full Portfolio
            </DropdownMenuItem>
            {assets.map((asset) => (
              <DropdownMenuItem
                key={asset.id}
                onClick={() => setSelectedContext(asset.id)}
              >
                {asset.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-slate-600 mb-3">
            Quick Prompts
          </h3>
          <div className="space-y-2">
            {presetPrompts.map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePreset(preset.prompt)}
                className="copilot-chip block w-full text-left text-xs"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="w-full text-slate-600"
          >
            Clear Conversation
          </Button>
        </div>

        <div className="mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="w-full text-slate-600"
          >
            锟?Back to Dashboard
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <Bot className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  RealFi AI Copilot
                </h2>
                <p className="text-slate-600 mb-6">
                  I can help you understand your RWA portfolio, analyze risks,
                  and suggest allocation adjustments. Select a context and ask
                  away.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {presetPrompts.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => handlePreset(preset.prompt)}
                      className="copilot-chip"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-slate-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Analyzing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleSend()
            }}
            className="max-w-2xl mx-auto flex gap-2"
          >
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your portfolio..."
              className="flex-1 bg-secondary"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
            {messages.length > 0 && !rebalancePlan && (
              <Button
                type="button"
                variant="outline"
                onClick={generateRebalancePlan}
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Plan
              </Button>
            )}
          </form>
        </div>
      </main>

      <aside className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border p-4 flex flex-col">
        <h2 className="text-sm font-medium text-slate-600 uppercase tracking-wider mb-4">
          Execution Notes
        </h2>

        {rebalancePlan ? (
          <div className="space-y-4">
            <div className="p-3 bg-secondary rounded-lg">
              <div className="text-sm font-medium mb-3">Rebalance Plan</div>
              <div className="space-y-2">
                {rebalancePlan.actions.map((action, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <span
                      className={
                        action.type === 'sell'
                          ? 'text-red-400'
                          : 'text-green-400'
                      }
                    >
                      {action.type.toUpperCase()}
                    </span>
                    <span className="text-slate-600">
                      {action.shares} units
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span>{action.assetName}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">APY Change</span>
                  <div>
                    <span>{rebalancePlan.currentAPY}%</span>
                    <ArrowRight className="w-3 h-3 inline mx-1 text-slate-600" />
                    <span className="text-green-400">
                      {rebalancePlan.projectedAPY}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Risk Change</span>
                  <div>
                    <span>{rebalancePlan.currentRisk}</span>
                    <ArrowRight className="w-3 h-3 inline mx-1 text-slate-600" />
                    <span className="text-green-400">
                      {rebalancePlan.projectedRisk}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Button className="w-full" variant="outline">
              Execute Plan
            </Button>
          </div>
        ) : (
          <div className="text-sm text-slate-600">
            Ask questions about your portfolio to generate a rebalancing plan.
          </div>
        )}

        <div className="mt-auto pt-6">
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                This is a demo. Not financial advice. Yields are simulated.
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-lg p-4 ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-slate-900'
          }`}
        >
          {message.content}
        </div>

        {message.recommendations && (
          <div className="mt-3 space-y-2">
            {message.recommendations.map((rec, index) => (
              <div
                key={index}
                className="text-sm bg-muted/50 rounded-lg p-3 border border-border"
              >
                <div className="font-medium">{rec.action}</div>
                <div className="text-slate-600 text-xs mt-1">{rec.reason}</div>
              </div>
            ))}
          </div>
        )}

        {message.riskNotes && (
          <div className="mt-3 flex items-start gap-2 text-xs text-slate-600">
            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>{message.riskNotes}</span>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  )
}
