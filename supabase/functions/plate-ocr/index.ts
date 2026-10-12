import { createClient } from "npm:@supabase/supabase-js@2.117.3"
import { corsHeaders, json } from "../_shared/http.ts"

Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders })
  if (request.method !== "POST")
    return json({ error: "Method not allowed." }, 405)
  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_ANON_KEY")
  const token = Deno.env.get("PLATE_RECOGNIZER_TOKEN")
  if (!url || !key || !token)
    return json({ error: "OCR is not configured." }, 503)
  const db = createClient(url, key, {
    global: {
      headers: { Authorization: request.headers.get("Authorization") || "" },
    },
  })
  const {
    data: { user },
  } = await db.auth.getUser()
  if (!user) return json({ error: "Sign in to capture a plate." }, 401)
  try {
    if (Number(request.headers.get("content-length")) > 7200000)
      return json({ error: "Image too large." }, 413)
    const body = await request.text()
    if (body.length > 7200000) return json({ error: "Image too large." }, 413)
    const { bookingId, image } = JSON.parse(body)
    const { data: jobs, error } = await db.rpc("gw_my_assigned_jobs")
    if (
      error ||
      !jobs?.some(
        (job: { booking_id: string status: string }) =>
          job.booking_id === bookingId &&
          ["accepted", "verdict_given"].includes(job.status),
      )
    )
      return json({ error: "No eligible assigned job." }, 403)
    if (typeof image !== "string" || !/^[A-Za-z0-9+/=]+$/.test(image))
      return json({ error: "Invalid image." }, 400)
    const form = new FormData()
    form.append("upload", image)
    const response = await fetch(
      "https://api.platerecognizer.com/v1/plate-reader/",
      {
        method: "POST",
        headers: { Authorization: `Token ${token}` },
        body: form,
        signal: AbortSignal.timeout(20000),
      },
    )
    if (!response.ok) return json({ error: "OCR provider unavailable." }, 502)
    const result = await response.json()
    const best = result.results
      ?.filter((item: { score: number }) => item.score >= 0.8)
      .sort(
        (a: { score: number }, b: { score: number }) => b.score - a.score,
      )[0]
    if (!best)
      return json(
        {
          error:
            "No confident plate detected. Retake the image or use manual entry.",
        },
        422,
      )
    return json({
      plate: String(best.plate).toUpperCase(),
      confidence: best.score,
    })
  } catch {
    return json({ error: "Unable to recognize plate." }, 400)
  }
})
