import { NextResponse } from 'next/server'
import { getDashboardMetrics } from '@/actions/admin/metrics'

export async function GET() {
  try {
    const metrics = await getDashboardMetrics()
    return NextResponse.json(metrics)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
