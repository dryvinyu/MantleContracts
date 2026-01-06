import { useContext } from 'react'

import { CopilotContext } from '../providers/CopilotProvider'

export default function useCopilot() {
  const context = useContext(CopilotContext)
  if (!context) {
    throw new Error('useCopilot must be used within a CopilotProvider')
  }
  return context
}
