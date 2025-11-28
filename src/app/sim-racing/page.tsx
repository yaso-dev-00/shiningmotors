import SimRacing from "@/views/SimRacing";
import { unstable_cache } from "next/cache";
import { simAppApi } from "@/integrations/supabase/modules/simAppPage";

// Time-based revalidation: regenerate sim-racing data every hour
export const revalidate = 3600;

const getSimRacingPageData = unstable_cache(
  async () => {
    const [
      leaguesResult,
      eventsResult,
      productsResult,
      garagesResult,
      leaderboardsResult,
    ] = await Promise.all([
      simAppApi.leagues.getActiveLeagues(),
      simAppApi.events.getUpcomingEvents(4),
      simAppApi.products.getFeaturedProducts(8),
      simAppApi.garages.getAllGarages(),
      simAppApi.leaderboards.getLeaderboards(),
    ]);

    const leagues = (leaguesResult as any)?.data ?? [];
    const events = (eventsResult as any)?.data ?? [];
    const products = (productsResult as any)?.data ?? [];
    const garages = (garagesResult as any)?.data ?? [];
    const leaderboards = (leaderboardsResult as any)?.data ?? [];

    // Fetch entries for the first leaderboard (if any) for the overview section
    let leaderboardEntries: any[] = [];
    if (leaderboards.length > 0 && leaderboards[0]?.id) {
      const { data } = await simAppApi.leaderboards.getLeaderboardEntries(
        leaderboards[0].id,
        5
      );
      leaderboardEntries = data ?? [];
    }

    return {
      leagues,
      events,
      products,
      garages,
      leaderboards,
      leaderboardEntries,
    };
  },
  ["sim-racing-page-data"],
  {
    revalidate: 3600,
    tags: ["sim-racing"],
  }
);

export default async function Page() {
  const data = await getSimRacingPageData();

  return <SimRacing {...data} />;
}




