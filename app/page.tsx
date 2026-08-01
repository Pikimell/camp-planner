import HomeDateSettings from "@/components/Home/HomeDateSettings";
import HomeHeader from "@/components/Home/HomeHeader";
import HomeMessages from "@/components/Home/HomeMessages";
import css from "./page.module.css";

const Page = () => {
  return (
    <main className={css["page"]}>
      <HomeHeader />

      <div className={css["content"]}>
        <HomeDateSettings />
        <HomeMessages />
      </div>
    </main>
  );
};

export default Page;
