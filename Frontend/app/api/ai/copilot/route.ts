import { NextResponse } from 'next/server'
import { postCopilotMessage } from '@/lib/api'

export const POST = async (request: Request) => {
  const body = await request.json()
  const response = await postCopilotMessage(body?.question ?? '')
  return NextResponse.json(response)
}
