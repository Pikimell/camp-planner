import css from "./Home.module.css";

const HomeHeader = () => {
  return (
    <section className={css["header"]}>
      <div>
        <p className={css["eyebrow"]}>Панель організатора</p>
        <h1 className={css["title"]}>Огляд походу</h1>
      </div>
      <div className={css["headerMeta"]}>
        <span>Camp Planner</span>
      </div>
    </section>
  );
};

export default HomeHeader;
