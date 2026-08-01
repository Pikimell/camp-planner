import css from "./Home.module.css";

const workflowSteps = [
  "Походи",
  "Учасники",
  "Продукти",
  "Страви",
  "Рецепти",
  "Раціон",
  "Чергування",
  "Розподіл",
  "Забір продуктів",
];

const HomeWorkflow = () => {
  return (
    <section className={css["section"]}>
      <div className={css["sectionHeader"]}>
        <h2>Послідовність планування</h2>
      </div>

      <ol className={css["workflowList"]}>
        {workflowSteps.map((step, index) => {
          return (
            <li className={css["workflowItem"]} key={step}>
              <span className={css["workflowIndex"]}>{index + 1}</span>
              <span>{step}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default HomeWorkflow;
