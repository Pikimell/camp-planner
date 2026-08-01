import HomeExportButton from "./HomeExportButton";
import HomeImportButton from "./HomeImportButton";
import css from "./Home.module.css";

const HomeHeader = () => {
  return (
    <section className={css["header"]}>
      <div>
        <p className={css["eyebrow"]}>Панель організатора</p>
        <h1 className={css["title"]}>Планування одного походу</h1>
      </div>
      <div className={css["headerActions"]}>
        <div className={css["headerMeta"]}>
          <span>Camp Planner</span>
        </div>
        <HomeExportButton />
        <HomeImportButton />
      </div>
    </section>
  );
};

export default HomeHeader;
