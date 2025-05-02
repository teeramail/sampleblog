import { type NextPage } from "next";
import Head from "next/head";
import { TopicList } from "~/components/forum/TopicList";
import { MainLayout } from "~/components/layout/MainLayout";

const ForumPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Forum | Real Estate</title>
        <meta name="description" content="Forum discussions for real estate topics" />
      </Head>
      <MainLayout>
        <TopicList />
      </MainLayout>
    </>
  );
};

export default ForumPage;
