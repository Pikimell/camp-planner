"use client";

import { FormEvent, useState } from "react";
import JsonStringImport from "@/components/JsonStringImport/JsonStringImport";
import { useMeals } from "@/hooks";
import { Meal } from "@/types/meals";
import { parseImportedMeal } from "@/utils/jsonImportParsers";
import css from "./MealsManager.module.css";

type MealFormState = Omit<Meal, "id">;

const initialFormState: MealFormState = {
  name: "",
  notes: "",
};

const MealsManager = () => {
  const { sortedMeals, mealsCount, addMeal, removeMeal, setMeals, updateMeal } =
    useMeals();
  const [formState, setFormState] = useState<MealFormState>(initialFormState);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = formState.name.trim();

    if (!name) {
      return;
    }

    addMeal({
      id: "",
      name,
      notes: formState.notes?.trim(),
    });

    setFormState(initialFormState);
  };

  const updateFormValue = <Field extends keyof MealFormState>(
    field: Field,
    value: MealFormState[Field],
  ) => {
    setFormState((currentFormState) => {
      return {
        ...currentFormState,
        [field]: value,
      };
    });
  };

  const updateMealField = <Field extends keyof Meal>(
    mealId: string,
    field: Field,
    value: Meal[Field],
  ) => {
    updateMeal(mealId, {
      [field]: value,
    });
  };

  return (
    <main className={css["page"]}>
      <section className={css["header"]}>
        <div>
          <p className={css["eyebrow"]}>Меню</p>
          <h1 className={css["title"]}>Страви</h1>
        </div>
        <div className={css["counter"]}>{mealsCount}</div>
      </section>

      <section className={css["section"]}>
        <div className={css["sectionHeader"]}>
          <h2>Додати страву</h2>
        </div>

        <form className={css["form"]} onSubmit={handleSubmit}>
          <label className={css["field"]}>
            <span>Назва</span>
            <input
              required
              value={formState.name}
              onChange={(event) => updateFormValue("name", event.target.value)}
              placeholder="Наприклад: Борщ"
            />
          </label>

          <label className={`${css["field"]} ${css["wideField"]}`}>
            <span>Нотатки</span>
            <textarea
              value={formState.notes}
              onChange={(event) => updateFormValue("notes", event.target.value)}
              placeholder="Необовʼязково"
            />
          </label>

          <button className={css["submitButton"]} type="submit">
            Додати
          </button>
        </form>
      </section>

      <JsonStringImport
        arrayKeys={["meals"]}
        description="Встав JSON-масив страв або обʼєкт з data.meals. Поточний список страв буде замінено імпортованим масивом."
        example={`[
  {
    "name": "Борщ",
    "notes": "Готувати на казані"
  }
]`}
        parseItem={parseImportedMeal}
        title="Імпорт страв з JSON"
        onImport={setMeals}
      />

      <section className={css["section"]}>
        <div className={css["sectionHeader"]}>
          <h2>Таблиця страв</h2>
        </div>

        {sortedMeals.length > 0 ? (
          <div className={css["tableWrapper"]}>
            <table className={css["table"]}>
              <thead>
                <tr>
                  <th>Назва</th>
                  <th>Нотатки</th>
                  <th aria-label="Дії" />
                </tr>
              </thead>
              <tbody>
                {sortedMeals.map((meal) => {
                  return (
                    <tr key={meal.id}>
                      <td>
                        <input
                          value={meal.name}
                          onChange={(event) =>
                            updateMealField(meal.id, "name", event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={meal.notes ?? ""}
                          onChange={(event) =>
                            updateMealField(meal.id, "notes", event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <button
                          className={css["deleteButton"]}
                          type="button"
                          onClick={() => removeMeal(meal.id)}
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
          <div className={css["emptyState"]}>Поки немає доданих страв.</div>
        )}
      </section>
    </main>
  );
};

export default MealsManager;
