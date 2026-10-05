import { redirect } from 'next/navigation'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { getVerifiedAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getVerifiedAdminSession()
  if (!session) redirect('/admin/login')

  return <DashboardOverview />
}
