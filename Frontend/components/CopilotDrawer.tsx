'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  RefreshCw,
  Send,
  TrendingDown,
  TrendingUp,
  User,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import useCopilot from '@/lib/hooks/useCopilot'
import type { Message } from '@/lib/providers/CopilotProvider'

interface CopilotDrawerProps {
  isOpen: boolean
  onClose: () => void
}

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

export default function CopilotDrawer({ isOpen, onClose }: CopilotDrawerProps) {
  const {
    messages,
    rebalancePlan,
    isLoading,
    sendMessage,
    generateRebalancePlan,
  } = useCopilot()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  if (!isOpen) return null

  return (
    <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border bg-card flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-semibold">AI Copilot</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              I can help you understand your RWA portfolio, analyze risks, and
              suggest allocation adjustments.
            </p>
            <div className="space-y-2">
              {presetPrompts.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePreset(preset.prompt)}
                  className="copilot-chip block w-full text-left"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
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

        {rebalancePlan && (
          <div className="mt-4 p-3 bg-secondary rounded-lg border border-border">
            <div className="text-sm font-medium mb-3">Rebalance Plan</div>
            <div className="space-y-2">
              {rebalancePlan.actions.map((action, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  {action.type === 'sell' ? (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  ) : (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  )}
                  <span
                    className={
                      action.type === 'sell' ? 'text-red-400' : 'text-green-400'
                    }
                  >
                    {action.type.toUpperCase()}
                  </span>
                  <span className="text-slate-600">{action.shares} units</span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span>{action.assetName}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-600">APY: </span>
                <span>{rebalancePlan.currentAPY}%</span>
                <ArrowRight className="w-3 h-3 inline mx-1 text-slate-600" />
                <span className="text-green-400">
                  {rebalancePlan.projectedAPY}%
                </span>
              </div>
              <div>
                <span className="text-slate-600">Risk: </span>
                <span>{rebalancePlan.currentRisk}</span>
                <ArrowRight className="w-3 h-3 inline mx-1 text-slate-600" />
                <span className="text-green-400">
                  {rebalancePlan.projectedRisk}
                </span>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {messages.length > 0 && !rebalancePlan && (
        <div className="px-4 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateRebalancePlan}
            disabled={isLoading}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate Rebalance Plan
          </Button>
        </div>
      )}

      <div className="p-4 border-t border-border">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about your portfolio..."
            className="flex-1 bg-secondary"
            disabled={isLoading}
          />
          <Button type="submit" size="sm" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-xs text-slate-600 mt-2 text-center">
          Demo only. Not financial advice.
        </p>
      </div>
    </div>
  )
}

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <Bot className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-lg p-3 text-sm ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-slate-900'
          }`}
        >
          {message.content}
        </div>

        {message.recommendations && (
          <div className="mt-2 space-y-1">
            {message.recommendations.map((rec, index) => (
              <div key={index} className="text-xs bg-muted/50 rounded p-2">
                <div className="font-medium">{rec.action}</div>
                <div className="text-slate-600">{rec.reason}</div>
              </div>
            ))}
          </div>
        )}

        {message.riskNotes && (
          <div className="mt-2 flex items-start gap-1 text-xs text-slate-600">
            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>{message.riskNotes}</span>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="w-3 h-3" />
        </div>
      )}
    </div>
  )
}
