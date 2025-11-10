// Utility for marking stories as seen and checking seen status using localStorage
export function markStoryAsSeen(storyId: string) {
  if (typeof window === 'undefined') return;
  const seen = JSON.parse(localStorage.getItem("seenStories") || "[]");
  if (!seen.includes(storyId)) {
    seen.push(storyId);
    localStorage.setItem("seenStories", JSON.stringify(seen));
  }
}

export function isStorySeen(storyId: string): boolean {
  if (typeof window === 'undefined') return false;
  const seen = JSON.parse(localStorage.getItem("seenStories") || "[]");
  return seen.includes(storyId);
}
