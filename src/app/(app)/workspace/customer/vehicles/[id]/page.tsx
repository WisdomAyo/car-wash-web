import type { Metadata } from "next"
import Passport from "@/features/customer/screens/Passport"

export const metadata: Metadata = { title: "Wash Passport" }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <Passport vehicleId={(await params).id} back="/workspace/customer/vehicles" />
}
