"use client";

import { FormEvent, useMemo, useState } from "react";
import JsonStringImport from "@/components/JsonStringImport/JsonStringImport";
import { useMeals, useSettings } from "@/hooks";
import { MealPlan, MealType } from "@/types/meals";
import { parseImportedMealPlan } from "@/utils/jsonImportParsers";
import css from "./MealPlanManager.module.css";

type MealPlanFormState = Omit<MealPlan, "id">;

const mealTypeOptions: MealType[] = ["Сніданок", "Обід", "Вечеря", "Перекус"];

const mealTypeOrder: Record<MealType, number> = {
  Сніданок: 1,
  Обід: 2,
  Вечеря: 3,
  Перекус: 4,
};

const getMealPlanType = (mealPlan: MealPlan) => mealPlan.mealType ?? "Сніданок";

const mealTypeLabels: Record<MealType, string> = {
  Сніданок: "ранок",
  Обід: "обід",
  Вечеря: "вечір",
  Перекус: "перекус",
};

const initialFormState: MealPlanFormState = {
  day: 1,
  mealId: "",
  mealType: "Сніданок",
};

const normalizeDay = (value: number) => {
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.trunc(value);
};

const formatAmount = (amount: number) => {
  return Number.isInteger(amount) ? String(amount) : String(amount).replace(".", ",");
};

const formatPlanDate = (startDate: string, day: number) => {
  if (!startDate) {
    return `День ${day}`;
  }

  const value = new Date(`${startDate}T00:00:00`);
  value.setDate(value.getDate() + day - 1);

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
  }).format(value);
};

const MealPlanManager = () => {
  const {
    sortedMeals,
    sortedMealPlans,
    mealPlansByDay,
    mealsById,
    ingredientsById,
    mealIngredientsByMealId,
    mealPlansCount,
    addMealPlan,
    removeMealPlan,
    setMealPlans,
    updateMealPlan,
  } = useMeals();
  const { startDate } = useSettings();
  const [formState, setFormState] =
    useState<MealPlanFormState>(initialFormState);

  const dayColumns = useMemo(() => {
    return Object.entries(mealPlansByDay)
      .map(([day, mealPlans]) => {
        return {
          day: Number(day),
          mealPlans: [...mealPlans].sort((firstPlan, secondPlan) => {
            return (
              mealTypeOrder[getMealPlanType(firstPlan)] -
              mealTypeOrder[getMealPlanType(secondPlan)]
            );
          }),
        };
      })
      .sort((firstDay, secondDay) => firstDay.day - secondDay.day);
  }, [mealPlansByDay]);

  const selectedMealId = formState.mealId || sortedMeals[0]?.id || "";

  const recipeTableCards = useMemo(() => {
    return sortedMealPlans.map((mealPlan) => {
      const meal = mealsById.get(mealPlan.mealId);
      const mealType = getMealPlanType(mealPlan);
      const recipeRows = mealIngredientsByMealId[mealPlan.mealId] ?? [];

      return {
        id: mealPlan.id,
        title: `${formatPlanDate(startDate, mealPlan.day)} ${mealTypeLabels[mealType]} - ${
          meal?.name.toUpperCase() ?? "СТРАВУ НЕ ЗНАЙДЕНО"
        }`,
        rows: recipeRows.map((recipeRow) => {
          const ingredient = ingredientsById.get(recipeRow.ingredientId);

          return {
            id: recipeRow.id,
            amount: formatAmount(recipeRow.amount),
            name: ingredient
              ? `${ingredient.name} ${ingredient.unit}`
              : "Інгредієнт не знайдено",
          };
        }),
      };
    });
  }, [
    ingredientsById,
    mealIngredientsByMealId,
    mealsById,
    sortedMealPlans,
    startDate,
  ]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedMealId) {
      return;
    }

    addMealPlan({
      id: "",
      day: normalizeDay(formState.day),
      mealId: selectedMealId,
      mealType: formState.mealType,
    });

    setFormState({
      ...initialFormState,
      mealId: selectedMealId,
      mealType: formState.mealType,
    });
  };

  const updateFormValue = <Field extends keyof MealPlanFormState>(
    field: Field,
    value: MealPlanFormState[Field],
  ) => {
    setFormState((currentFormState) => {
      return {
        ...currentFormState,
        [field]: value,
      };
    });
  };

  const updateMealPlanField = <Field extends keyof MealPlan>(
    mealPlanId: string,
    field: Field,
    value: MealPlan[Field],
  ) => {
    updateMealPlan(mealPlanId, {
      [field]: value,
    });
  };

  return (
    <main className={css["page"]}>
      <section className={css["header"]}>
        <div>
          <p className={css["eyebrow"]}>Раціон</p>
          <h1 className={css["title"]}>Меню по днях</h1>
        </div>
        <div className={css["counter"]}>{mealPlansCount}</div>
      </section>

      <section className={css["section"]}>
        <div className={css["sectionHeader"]}>
          <h2>Додати страву в раціон</h2>
        </div>

        <form className={css["form"]} onSubmit={handleSubmit}>
          <label className={css["field"]}>
            <span>День</span>
            <input
              min={1}
              type="number"
              value={formState.day}
              onChange={(event) =>
                updateFormValue("day", normalizeDay(Number(event.target.value)))
              }
            />
          </label>

          <label className={css["field"]}>
            <span>Тип</span>
            <select
              value={formState.mealType}
              onChange={(event) =>
                updateFormValue("mealType", event.target.value as MealType)
              }
            >
              {mealTypeOptions.map((mealType) => {
                return (
                  <option key={mealType} value={mealType}>
                    {mealType}
                  </option>
                );
              })}
            </select>
          </label>

          <label className={css["field"]}>
            <span>Страва</span>
            <select
              disabled={sortedMeals.length === 0}
              value={selectedMealId}
              onChange={(event) => updateFormValue("mealId", event.target.value)}
            >
              {sortedMeals.length > 0 ? (
                sortedMeals.map((meal) => {
                  return (
                    <option key={meal.id} value={meal.id}>
                      {meal.name}
                    </option>
                  );
                })
              ) : (
                <option value="">Спочатку додайте страви</option>
              )}
            </select>
          </label>

          <button
            className={css["submitButton"]}
            disabled={sortedMeals.length === 0}
            type="submit"
          >
            Додати
          </button>
        </form>
      </section>

      <JsonStringImport
        arrayKeys={["mealPlans"]}
        description="Встав JSON-масив раціону або обʼєкт з data.mealPlans. Поточний раціон буде замінено імпортованим масивом."
        example={`[
  {
    "day": 1,
    "mealId": "meal-1",
    "mealType": "Вечеря"
  }
]`}
        parseItem={parseImportedMealPlan}
        title="Імпорт раціону з JSON"
        onImport={setMealPlans}
      />

      <section className={css["section"]}>
        <div className={css["sectionHeader"]}>
          <h2>Таблиця раціону</h2>
        </div>

        {sortedMealPlans.length > 0 ? (
          <div className={css["tableWrapper"]}>
            <table className={css["table"]}>
              <thead>
                <tr>
                  <th>День</th>
                  <th>Тип</th>
                  <th>Страва</th>
                  <th aria-label="Дії" />
                </tr>
              </thead>
              <tbody>
                {sortedMealPlans.map((mealPlan) => {
                  return (
                    <tr key={mealPlan.id}>
                      <td>
                        <input
                          min={1}
                          type="number"
                          value={mealPlan.day}
                          onChange={(event) =>
                            updateMealPlanField(
                              mealPlan.id,
                              "day",
                              normalizeDay(Number(event.target.value)),
                            )
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={getMealPlanType(mealPlan)}
                          onChange={(event) =>
                            updateMealPlanField(
                              mealPlan.id,
                              "mealType",
                              event.target.value as MealType,
                            )
                          }
                        >
                          {mealTypeOptions.map((mealType) => {
                            return (
                              <option key={mealType} value={mealType}>
                                {mealType}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td>
                        <select
                          value={mealPlan.mealId}
                          onChange={(event) =>
                            updateMealPlanField(
                              mealPlan.id,
                              "mealId",
                              event.target.value,
                            )
                          }
                        >
                          {sortedMeals.map((mealOption) => {
                            return (
                              <option key={mealOption.id} value={mealOption.id}>
                                {mealOption.name}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td>
                        <button
                          className={css["deleteButton"]}
                          type="button"
                          onClick={() => removeMealPlan(mealPlan.id)}
                        >
                          Видалити
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={css["emptyState"]}>Поки немає записів у раціоні.</div>
        )}
      </section>

      <section className={css["section"]}>
        <div className={css["sectionHeader"]}>
          <h2>Раціон по днях</h2>
        </div>

        {dayColumns.length > 0 ? (
          <div className={css["daysGrid"]}>
            {dayColumns.map((dayColumn) => {
              return (
                <article className={css["dayColumn"]} key={dayColumn.day}>
                  <div className={css["dayHeader"]}>
                    <h3>День {dayColumn.day}</h3>
                    <span>{dayColumn.mealPlans.length}</span>
                  </div>

                  <ul className={css["dayMeals"]}>
                    {dayColumn.mealPlans.map((mealPlan) => {
                      const meal = mealsById.get(mealPlan.mealId);

                      return (
                        <li className={css["dayMeal"]} key={mealPlan.id}>
                          <span>{meal?.name ?? "Страву не знайдено"}</span>
                          <small>{getMealPlanType(mealPlan)}</small>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={css["emptyState"]}>
            Додайте страви в раціон, щоб побачити меню по днях.
          </div>
        )}
      </section>

      <section className={css["section"]}>
        <div className={css["sectionHeader"]}>
          <h2>Розкладка продуктів по прийомах їжі</h2>
        </div>

        {recipeTableCards.length > 0 ? (
          <div className={css["recipeTablesGrid"]}>
            {recipeTableCards.map((card) => {
              const blankRowsCount = Math.max(0, 10 - card.rows.length);

              return (
                <article className={css["recipeTableCard"]} key={card.id}>
                  <div className={css["recipeTableTitle"]}>{card.title}</div>

                  <table className={css["recipeTable"]}>
                    <tbody>
                      {card.rows.map((row) => {
                        return (
                          <tr key={row.id}>
                            <td>{row.name}</td>
                            <td>{row.amount}</td>
                            <td />
                          </tr>
                        );
                      })}

                      {Array.from({ length: blankRowsCount }).map((_, index) => {
                        return (
                          <tr key={`${card.id}-blank-${index}`}>
                            <td />
                            <td />
                            <td />
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={css["emptyState"]}>
            Додайте страви в раціон і заповніть рецепти, щоб побачити розкладку.
          </div>
        )}
      </section>
    </main>
  );
};

export default MealPlanManager;
