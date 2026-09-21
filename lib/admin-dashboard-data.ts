import type { DashboardData } from '@/components/dashboard/dashboard-overview'

export async function getAdminDashboardData(): Promise<DashboardData | null> {
  const baseUrl = process.env.BIMBIM_API_URL?.replace(/\/$/, '')
  if (!baseUrl) return null
  try {
    const response = await fetch(baseUrl + '/api/admin/dashboard', { cache: 'no-store' })
    if (!response.ok) throw new Error('Admin API ' + response.status)
    return await response.json()
  } catch {
    return null
  }
}
