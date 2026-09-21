import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { getAdminDashboardData } from '@/lib/admin-dashboard-data'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const data = await getAdminDashboardData()
  return <DashboardOverview data={data ?? undefined} />
}
