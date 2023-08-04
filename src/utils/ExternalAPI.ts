import { z } from "zod"

export const AniAPI = "https://api.anisync.nat3z.com"

const TOKEN_API_RESPONSE = z.object({
  code: z.number(),
  message: z.string().optional(),
  data: z.object({
    access_token: z.string(),
    expires: z.number()
  }).optional()
})
export async function getAccessToken(refresh_token: string) {
  const toSend = JSON.stringify({
    "client_id": process.env.API_CLIENT_ID,
    "refresh_token": refresh_token,
    "secret": process.env.API_SECRET
  })
  const fetchRes = await fetch(AniAPI + "/v1/token", {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: `${toSend}`
  })
  const tokenAPI_parse = TOKEN_API_RESPONSE.safeParse(await fetchRes.json())
  if (!tokenAPI_parse.success) {
    console.log(tokenAPI_parse.error)
    return "-1"
  }
  if (!tokenAPI_parse.data.data) return "-1"
  return tokenAPI_parse.data.data?.access_token as string
}