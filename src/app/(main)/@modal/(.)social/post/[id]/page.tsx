"use client";

import { use } from "react";
import PostModal from "@/components/social/PostModal";

export default function InterceptedPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <PostModal key={id} postId={id} />;
}


