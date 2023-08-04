import { router } from "../trpc";
import { animeRouter } from "./animeinfo";

export const appRouter = router({
  anime: animeRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
