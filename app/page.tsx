import HomeHeader from "@/components/Home/HomeHeader";
import HomeQuickLinks from "@/components/Home/HomeQuickLinks";
import HomeStats from "@/components/Home/HomeStats";
import HomeWorkflow from "@/components/Home/HomeWorkflow";
import css from "./page.module.css";

const Page = () => {
  return (
    <main className={css["page"]}>
      <HomeHeader />

      <div className={css["content"]}>
        <HomeStats />
        <HomeQuickLinks />
        <HomeWorkflow />
      </div>
    </main>
  );
};

export default Page;
