"use client";

import { useDutySchedule, useMeals, useMembers } from "@/hooks";
import css from "./Home.module.css";

const HomeStats = () => {
  const { membersCount } = useMembers();
  const {
    ingredientsCount,
    mealsCount,
    mealPlansCount,
    mealIngredients,
    getRequiredIngredients,
  } = useMeals();
  const { dutySchedulesCount, foodAssignmentsCount, foodPickupsCount } =
    useDutySchedule();

  const requiredIngredientsCount = Object.keys(getRequiredIngredients()).length;

  const stats = [
    { label: "Учасники", value: membersCount },
    { label: "Продукти", value: ingredientsCount },
    { label: "Страви", value: mealsCount },
    { label: "Рецепти", value: mealIngredients.length },
    { label: "Раціон", value: mealPlansCount },
    { label: "Чергування", value: dutySchedulesCount },
    { label: "Розподіл", value: foodAssignmentsCount },
    { label: "Забір продуктів", value: foodPickupsCount },
    { label: "Потрібно продуктів", value: requiredIngredientsCount },
  ];

  return (
    <section className={css["statsGrid"]} aria-label="Статистика планування">
      {stats.map((stat) => {
        return (
          <article className={css["statCard"]} key={stat.label}>
            <span className={css["statValue"]}>{stat.value}</span>
            <span className={css["statLabel"]}>{stat.label}</span>
          </article>
        );
      })}
    </section>
  );
};

export default HomeStats;
