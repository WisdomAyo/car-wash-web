"use client"

import Link from "next/link"
import { PageHeader } from "@/components/app/kit"
import { VerdictPanel } from "@/features/shared/BookingDetail"
import { usePartner } from "../PartnerSpace"

/** A named confirmer checks a finished wash on their own vehicle and gives the verdict. */
export default function Confirm({ jobId }: { jobId: string }) {
  const { base } = usePartner()
  return (
    <>
      <PageHeader eyebrow="CONFIRM THE WASH" title="Does it look right?" description="The right person has the final say. You are only asked when a wash is ready." action={<Link className="secondary" href={`${base}/jobs`}>Back to active washes</Link>} />
      <VerdictPanel jobId={jobId} onDone={() => {}} />
    </>
  )
}
