import { type NextPage } from "next";
import Head from "next/head";
import { CreateTopicForm } from "~/components/forum/CreateTopicForm";
import { MainLayout } from "~/components/layout/MainLayout";

const NewTopicPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Create New Topic | Real Estate Forum</title>
        <meta name="description" content="Create a new discussion topic" />
      </Head>
      <MainLayout>
        <CreateTopicForm />
      </MainLayout>
    </>
  );
};

export default NewTopicPage;
