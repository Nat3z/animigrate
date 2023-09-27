import { z } from "zod";
import { AniAPI, getAccessToken } from "../../../utils/ExternalAPI";

import { router, publicProcedure } from "../trpc";

const AnimesToUpdate = z.object({
  id: z.number(),
  status: z.enum([ "watching", "completed", "on_hold", "dropped", "plan_to_watch" ]).optional(),
  num_watched_episodes: z.number().optional(),

  rewatch_value: z.number().optional(),
  score: z.number().optional(),
  is_rewatching: z.boolean().optional(),  
  priority: z.number().optional(),
  num_times_rewatched: z.number().optional(),
  tags: z.string().array().optional(),
  comments: z.string().optional()
})

type $AnimesToUpdate = z.infer<typeof AnimesToUpdate>

const MeAnimeResponse = z.object({
  code: z.number(),
  message: z.string().optional(),
  data: z.object({
    mal: z.string(),
    anilist: z.string(),
    discord: z.string()
  })
})
export const animeRouter = router({
  userinfo: publicProcedure
    .input(z.object({ refresh_token: z.string() }))
    .output(z.object({ discord: z.string(), anilist: z.string(), mal: z.string(), errored: z.boolean().default(false) }))
    .mutation(async ({ input }) => {
      const access_token = await getAccessToken(input.refresh_token)
      if (access_token === "-1") return { anilist: "", discord: "", mal: "", errored: true }
      const toSend = JSON.stringify({
        "client_id": process.env.API_CLIENT_ID,
        "secret": process.env.API_SECRET
      })
      const fetchRes = await fetch(AniAPI + "/v1/user/me", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          "Authorization": "Bearer " + access_token
        },
        body: `${toSend}`
      })
      const me_parse = MeAnimeResponse.safeParse(await fetchRes.json())
      if (!me_parse.success || !me_parse.data.data) return { anilist: "", discord: "", mal: "", errored: true }
      return { mal: me_parse.data.data.anilist, anilist: me_parse.data.data.anilist, discord: me_parse.data.data.discord, errored: false }
    }),
  migrate: publicProcedure
    .input(z.object({ refresh_token: z.string(), from: z.enum([ "anilist", "mal" ]), to: z.enum([ "anilist", "mal" ]) }))
    .output(z.boolean())
    .mutation(async ({ input }) => {
      const access_token = await getAccessToken(input.refresh_token)
      if (access_token === "-1") {
        console.log("Failed Access Token")
        return false
      }
      const toSendRead = JSON.stringify({
        "client_id": process.env.API_CLIENT_ID,
        "secret": process.env.API_SECRET,
        "provider": input.from
      })


      const readData = await (await fetch(AniAPI + "/v1/user/read", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          "Authorization": "Bearer " + access_token
        },
        body: toSendRead
      })).json()

      if (!readData.data) {
        console.log(readData)
        return false
      }

      const dataFromProvider: $AnimesToUpdate[] = []

      if (input.from === "anilist") {
        for (const animeList of readData.data) {
          const animesToBeMAL = new Map<string, $AnimesToUpdate>()

          let query = ``
          for (const anime of animeList.entries) {
            const mediaId = anime.mediaId
            const status = anime.status
            const score = anime.score
            const progress = anime.progress
            const note = anime.notes
            const timesrepeat = anime.repeat

            animesToBeMAL.set(mediaId, {
              // USED TO BE CONVERTED
              id: mediaId,
              // this is safe because the api is based off of AniList's own way of status
              status: status,
              score: score,
              num_watched_episodes: progress,
              comments: note,
              num_times_rewatched: timesrepeat
            })

            query += `A${mediaId}: Media(id: ${mediaId}, type: ANIME) {id idMal}`
          }

          query = `query { ${query} }`
          // invoke gql request
          const gqlRes = await (await fetch(`https://graphql.anilist.co`, {
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: query,
              variables: null
            })
          })).json()
          if (!gqlRes.data) return false

          for (const [ key, value ] of Object.entries<any>(gqlRes.data)) {
            if (!value || !key) continue
            const modifiedEntry = animesToBeMAL.get(value.id)
            if (!modifiedEntry) continue

            // modify entry to mal id as that is standard for api
            modifiedEntry.id = value.idMal
            dataFromProvider.push(modifiedEntry)
          }

        }
      }

      const dataToSendAnimeUpdate = JSON.stringify({
        "client_id": process.env.API_CLIENT_ID,
        "secret": process.env.API_SECRET,
        "provider": [ input.to ],
        "animes": dataFromProvider
      })

      const updateResult = await fetch(AniAPI + "/v1/user/update", {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
          "Authorization": 'Bearer ' + access_token
        },
        body: dataToSendAnimeUpdate
      })

      return updateResult.ok
    })
});
