import { Suspense } from 'react'
import { DeliveriesModulePage } from '@/components/deliveries/deliveries-module'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DeliveriesModulePage />
    </Suspense>
  )
}
