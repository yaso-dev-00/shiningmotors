import EventCategory from "@/views/EventCategory";
import { getEventsByCategory, getEventCategories } from "@/integrations/supabase/modules/eventAppPage";
import { unstable_cache } from "next/cache";

// Time-based revalidation: regenerate events data every hour
export const revalidate = 3600; // seconds

const getEventCategoryPageData = (category: string) => unstable_cache(
  async () => {
    const [events, categories] = await Promise.all([
      getEventsByCategory(category),
      getEventCategories(),
    ]);

    return {
      events: events ?? [],
      categories: categories ?? [],
    };
  },
  [`event-category-page-data-${category}`],
  {
    revalidate: 3600,
    tags: ["events"],
  }
);

export default async function Page({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  // Await params (Next.js 15+)
  const { category: categoryParam } = await params;
  // Decode the category parameter from URL
  const category = decodeURIComponent(categoryParam);
  const { events, categories } = await getEventCategoryPageData(category)();

  return (
    <EventCategory
      initialEvents={events}
      initialCategories={categories}
      category={category}
    />
  );
}




