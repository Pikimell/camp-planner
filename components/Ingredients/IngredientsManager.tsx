"use client";

import { FormEvent, useState } from "react";
import JsonStringImport from "@/components/JsonStringImport/JsonStringImport";
import { useMeals } from "@/hooks";
import { Ingredient, Unit } from "@/types/meals";
import { parseImportedIngredient } from "@/utils/jsonImportParsers";
import css from "./IngredientsManager.module.css";

type IngredientFormState = Omit<Ingredient, "id">;

const unitOptions: Unit[] = ["кг", "г", "шт", "банка", "пакетик", "пачка"];

const initialFormState: IngredientFormState = {
  name: "",
  unit: "кг",
  weight: 0,
};

const normalizeAmount = (value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
};

const IngredientsManager = () => {
  const {
    sortedIngredients,
    ingredientsCount,
    addIngredient,
    removeIngredient,
    setIngredients,
    updateIngredient,
  } = useMeals();
  const [formState, setFormState] =
    useState<IngredientFormState>(initialFormState);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = formState.name.trim();

    if (!name) {
      return;
    }

    addIngredient({
      id: "",
      name,
      unit: formState.unit,
      weight: normalizeAmount(formState.weight),
    });

    setFormState(initialFormState);
  };

  const updateFormValue = <Field extends keyof IngredientFormState>(
    field: Field,
    value: IngredientFormState[Field],
  ) => {
    setFormState((currentFormState) => {
      return {
        ...currentFormState,
        [field]: value,
      };
    });
  };

  const updateIngredientField = <Field extends keyof Ingredient>(
    ingredientId: string,
    field: Field,
    value: Ingredient[Field],
  ) => {
    updateIngredient(ingredientId, {
      [field]: value,
    });
  };

  return (
    <main className={css["page"]}>
      <section className={css["header"]}>
        <div>
          <p className={css["eyebrow"]}>Продукти</p>
          <h1 className={css["title"]}>Інгредієнти</h1>
        </div>
        <div className={css["counter"]}>{ingredientsCount}</div>
      </section>

      <section className={css["section"]}>
        <div className={css["sectionHeader"]}>
          <h2>Додати інгредієнт</h2>
        </div>

        <form className={css["form"]} onSubmit={handleSubmit}>
          <label className={css["field"]}>
            <span>Назва</span>
            <input
              required
              value={formState.name}
              onChange={(event) => updateFormValue("name", event.target.value)}
              placeholder="Наприклад: Картопля"
            />
          </label>

          <label className={css["field"]}>
            <span>Одиниця</span>
            <select
              value={formState.unit}
              onChange={(event) =>
                updateFormValue("unit", event.target.value as Unit)
              }
            >
              {unitOptions.map((unit) => {
                return (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                );
              })}
            </select>
          </label>

          <label className={css["field"]}>
            <span>Вага</span>
            <input
              min={0}
              step="0.01"
              type="number"
              value={formState.weight}
              onChange={(event) =>
                updateFormValue(
                  "weight",
                  normalizeAmount(Number(event.target.value)),
                )
              }
            />
          </label>

          <button className={css["submitButton"]} type="submit">
            Додати
          </button>
        </form>
      </section>

      <JsonStringImport
        arrayKeys={["ingredients"]}
        description="Встав JSON-масив інгредієнтів або обʼєкт з data.ingredients. Поточний список інгредієнтів буде замінено імпортованим масивом."
        example={`[
  {
    "name": "Картопля",
    "unit": "кг",
    "weight": 1
  }
]`}
        parseItem={parseImportedIngredient}
        title="Імпорт інгредієнтів з JSON"
        onImport={setIngredients}
      />

      <section className={css["section"]}>
        <div className={css["sectionHeader"]}>
          <h2>Таблиця інгредієнтів</h2>
        </div>

        {sortedIngredients.length > 0 ? (
          <div className={css["tableWrapper"]}>
            <table className={css["table"]}>
              <thead>
                <tr>
                  <th>Назва</th>
                  <th>Одиниця</th>
                  <th>Вага</th>
                  <th aria-label="Дії" />
                </tr>
              </thead>
              <tbody>
                {sortedIngredients.map((ingredient) => {
                  return (
                    <tr key={ingredient.id}>
                      <td>
                        <input
                          value={ingredient.name}
                          onChange={(event) =>
                            updateIngredientField(
                              ingredient.id,
                              "name",
                              event.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={ingredient.unit}
                          onChange={(event) =>
                            updateIngredientField(
                              ingredient.id,
                              "unit",
                              event.target.value as Unit,
                            )
                          }
                        >
                          {unitOptions.map((unit) => {
                            return (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td>
                        <input
                          min={0}
                          step="0.01"
                          type="number"
                          value={ingredient.weight}
                          onChange={(event) =>
                            updateIngredientField(
                              ingredient.id,
                              "weight",
                              normalizeAmount(Number(event.target.value)),
                            )
                          }
                        />
                      </td>
                      <td>
                        <button
                          className={css["deleteButton"]}
                          type="button"
                          onClick={() => removeIngredient(ingredient.id)}
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
          <div className={css["emptyState"]}>Поки немає інгредієнтів.</div>
        )}
      </section>
    </main>
  );
};

export default IngredientsManager;
