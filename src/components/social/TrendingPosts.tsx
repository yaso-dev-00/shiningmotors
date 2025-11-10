import PostTabs from "./PostTabs";

interface TrendingPostsProps {
  renderAfterIndex?: number;
  AfterComponent?: React.ReactNode;
}

const TrendingPosts = ({
  renderAfterIndex,
  AfterComponent,
}: TrendingPostsProps) => {
  return (
    <PostTabs
      renderAfterIndex={renderAfterIndex}
      AfterComponent={AfterComponent}
    />
  );
};

export default TrendingPosts;
