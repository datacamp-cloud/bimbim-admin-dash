import { Suspense } from "react"
import { ReturnsModule } from "@/components/returns/returns-module"
export default function Page(){return <Suspense fallback={null}><ReturnsModule/></Suspense>}