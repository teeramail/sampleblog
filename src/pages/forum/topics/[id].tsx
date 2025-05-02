import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { TopicDetail } from "~/components/forum/TopicDetail";
import { MainLayout } from "~/components/layout/MainLayout";

const TopicDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  // Ensure id is a string
  const topicId = typeof id === "string" ? id : "";

  return (
    <>
      <Head>
        <title>Topic | Real Estate Forum</title>
        <meta name="description" content="View topic and posts" />
      </Head>
      <MainLayout>
        {topicId ? (
          <TopicDetail topicId={topicId} />
        ) : (
          <div className="py-8 text-center">Loading...</div>
        )}
      </MainLayout>
    </>
  );
};

export default TopicDetailPage;
