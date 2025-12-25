import PostTabs from "./PostTabs";

interface TrendingPostsProps {
  renderAfterIndex?: number;
  AfterComponent?: React.ReactNode;
  onOpenPost?: (id: string) => void;
}

const TrendingPosts = ({
  renderAfterIndex,
  AfterComponent,
  onOpenPost,
}: TrendingPostsProps) => {
  return (
    <PostTabs
      renderAfterIndex={renderAfterIndex}
      AfterComponent={AfterComponent}
      onOpenPost={onOpenPost}
    />
  );
};

export default TrendingPosts;
