import { GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { Nunito_Sans } from '@next/font/google'
import Link from 'next/link'
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { AniAPI } from "../utils/ExternalAPI";

import { trpc } from "../utils/trpc";

const nunito_sans = Nunito_Sans({ weight: "600" })
export default function Home({ client_id, redirect_url }: { client_id: string, redirect_url: string }) {
  let router = useRouter()
  const user = trpc.anime.userinfo.useMutation()
  const migrateUser = trpc.anime.migrate.useMutation()
  const refresh_token = useRef("")
  let [ migrationProcessing, setMigrationProcessing ] = useState(false)

  const executeMigration = () => {
    migrateUser.mutate({ refresh_token: refresh_token.current!, from: "anilist", to: "mal" })
  }
  useEffect(() => {
    let refresh_tokenQuery = router.query.refresh_token
    if (typeof refresh_tokenQuery !== "string") return
    refresh_token.current = refresh_tokenQuery
    user.mutate({ refresh_token: refresh_tokenQuery })
  }, [ router.isReady ])
  return (
    <>
      <Head>
        <title>AniMigrate</title>
        <meta name="description" content="An anime migration service." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="bg-anime-bg bg-img-anime bg-cover">
        <main className="justify-center items-center backdrop-blur-md flex-col flex w-full-vw h-full-vh bg-cover">
          <div className={`${nunito_sans.className} ml-2 mr-2 sm:ml-0 sm:mr-0 flex flex-col max-w-md justify-center items-top animate-fade-pop-in opacity-0 rounded-md p-6 text-black bg-white bg-opacity-40 backdrop-blur-xl drop-shadow-lg gap-2`}>
            <h1 className="text-center text-3xl font-bold bg-gradient-to-r from-anime-light-blue to-anime-dark-blue text-transparent bg-clip-text mb-1">Anime Migration</h1>
            { router.query.refresh_token ?
              <>
                { user.data && user.data.discord !== "" ?
                  <div className="text-xl font-bold text-gray-500 text-center flex flex-col gap-2">
                    <h1 className="drop-shadow-lg">Logged in as {user.data.discord}</h1>
                    
                    <div className="flex justify-center items-center gap-4">
                      <Image className="rounded-lg drop-shadow-xl" width={50} height={50} src="/anilist.png" alt="AniList"/>
                      <h1>to</h1>
                      <Image className="rounded-lg drop-shadow-xl" width={50} height={50} src="/mal.png" alt="MAL"/>
                    </div>

                    { migrateUser.isLoading ? 
                      <div className="m-auto dot-flashing"></div>
                    : 
                      <button className="p-2 pl-4 pr-4 w-fit m-auto bg-[#005cff] text-white font-normal rounded-lg" onClick={executeMigration} >Migrate</button>
                    }
                    

                    { migrateUser.data &&
                      <h1 className="text-green-400 text-xl text-center">Successful Migration!</h1>
                    }
                    { !migrateUser.data && migrateUser.isSuccess &&
                      <h1 className="text-red-400 text-xl text-center">Failed to Migrate</h1>
                    }
                  </div>
                : <>
                  { user.data && user.data.errored ?
                    <Link className="text-center text-gray-500 font-bold text-xl underline" href={`${AniAPI}/v1/authorize?client_id=${client_id}&redirect=${redirect_url}&intents=read,write,profile`}>Authorize to AniSync</Link>
                  :
                    <div className="m-auto dot-flashing"></div>
                  }
                </>}
              </>
            : 
              <>
                <Link className="text-gray-500 font-bold text-xl underline text-center" href={`${AniAPI}/v1/authorize?client_id=${client_id}&redirect=${redirect_url}&intents=read,write,profile`}>Authorize to AniSync</Link>
              </>
            }
          </div>

          <h1 className="bottom-2 fixed p-2 pl-4 pr-4 text-gray-700 bg-white bg-opacity-40 backdrop-blur-xl drop-shadow-lg rounded-lg">Made by Nat3z, Demoware for <Link className="underline" href={AniAPI}>AniSync</Link></h1>
        </main>

      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = (context) => {
  return {
    props: {
      client_id: process.env.API_CLIENT_ID!,
      redirect_url: process.env.NEXT_PUBLIC_DOMAIN!
    }
  }
}