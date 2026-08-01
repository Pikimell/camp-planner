"use client";

import { useMemo, useState } from "react";
import JsonStringImport from "@/components/JsonStringImport/JsonStringImport";
import { useMeals } from "@/hooks";
import { MealIngredient } from "@/types/meals";
import { parseImportedMealIngredient } from "@/utils/jsonImportParsers";
import css from "./RecipesManager.module.css";

const normalizeAmount = (value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
};

const RecipesManager = () => {
  const {
    sortedMeals,
    sortedIngredients,
    mealIngredients,
    mealIngredientsByMealId,
    mealsById,
    ingredientsById,
    addMealIngredient,
    removeMealIngredient,
    setMealIngredients,
    updateMealIngredient,
  } = useMeals();
  const [activeMealId, setActiveMealId] = useState("");

  const selectedEditorMealId = activeMealId || sortedMeals[0]?.id || "";
  const selectedEditorMeal = mealsById.get(selectedEditorMealId);
  const selectedEditorRecipe = useMemo(() => {
    return mealIngredientsByMealId[selectedEditorMealId] ?? [];
  }, [mealIngredientsByMealId, selectedEditorMealId]);

  const recipeCards = useMemo(() => {
    return sortedMeals
      .map((meal) => {
        return {
          meal,
          ingredients: mealIngredientsByMealId[meal.id] ?? [],
        };
      })
      .filter((recipe) => recipe.ingredients.length > 0);
  }, [sortedMeals, mealIngredientsByMealId]);

  const addIngredientToSelectedMeal = () => {
    const ingredientId = sortedIngredients[0]?.id;

    if (!selectedEditorMealId || !ingredientId) {
      return;
    }

    addMealIngredient({
      id: "",
      mealId: selectedEditorMealId,
      ingredientId,
      amount: 0,
    });
  };

  const updateRecipeField = <Field extends keyof MealIngredient>(
    recipeId: string,
    field: Field,
    value: MealIngredient[Field],
  ) => {
    updateMealIngredient(recipeId, {
      [field]: value,
    });
  };

  const isAddDisabled =
    sortedMeals.length === 0 ||
    sortedIngredients.length === 0 ||
    !selectedEditorMealId;

  return (
    <main className={css["page"]}>
      <section className={css["header"]}>
        <div>
          <p className={css["eyebrow"]}>Рецепти</p>
          <h1 className={css["title"]}>Склад страв</h1>
        </div>
        <div className={css["counter"]}>{mealIngredients.length}</div>
      </section>

      <JsonStringImport
        arrayKeys={["mealIngredients", "recipes"]}
        description="Встав JSON-масив рядків рецепту або обʼєкт з data.mealIngredients. Поточні рецепти будуть замінені імпортованим масивом."
        example={`[
  {
    "mealId": "meal-1",
    "ingredientId": "ingredient-1",
    "amount": 2
  }
]`}
        parseItem={parseImportedMealIngredient}
        title="Імпорт рецептів з JSON"
        onImport={setMealIngredients}
      />

      <section className={css["section"]}>
        <div className={css["sectionHeader"]}>
          <h2>Редактор рецепту</h2>
        </div>

        {sortedMeals.length > 0 ? (
          <div className={css["recipeEditor"]}>
            <aside className={css["mealsList"]} aria-label="Список страв">
              {sortedMeals.map((meal) => {
                const recipeCount = mealIngredientsByMealId[meal.id]?.length ?? 0;
                const isActive = meal.id === selectedEditorMealId;

                return (
                  <button
                    className={`${css["mealTab"]} ${
                      isActive ? css["activeMealTab"] : ""
                    }`}
                    key={meal.id}
                    type="button"
                    onClick={() => {
                      setActiveMealId(meal.id);
                    }}
                  >
                    <span>{meal.name}</span>
                    <small>{recipeCount}</small>
                  </button>
                );
              })}
            </aside>

            <div className={css["selectedRecipe"]}>
              <div className={css["selectedRecipeHeader"]}>
                <div>
                  <span className={css["selectedRecipeLabel"]}>Страва</span>
                  <h3>{selectedEditorMeal?.name ?? "Страву не знайдено"}</h3>
                </div>
                <span className={css["selectedRecipeCount"]}>
                  {selectedEditorRecipe.length}
                </span>
              </div>

              {selectedEditorRecipe.length > 0 ? (
                <ul className={css["editableIngredients"]}>
                  {selectedEditorRecipe.map((recipeRow) => {
                    const ingredient = ingredientsById.get(recipeRow.ingredientId);

                    return (
                      <li className={css["editableIngredient"]} key={recipeRow.id}>
                        <select
                          onChange={(event) =>
                            updateRecipeField(
                              recipeRow.id,
                              "ingredientId",
                              event.target.value,
                            )
                          }
                          value={recipeRow.ingredientId}
                        >
                          {sortedIngredients.map((ingredientOption) => {
                            return (
                              <option
                                key={ingredientOption.id}
                                value={ingredientOption.id}
                              >
                                {ingredientOption.name}
                              </option>
                            );
                          })}
                        </select>
                        <input
                          min={0}
                          step="0.01"
                          type="number"
                          value={recipeRow.amount}
                          onChange={(event) =>
                            updateRecipeField(
                              recipeRow.id,
                              "amount",
                              normalizeAmount(Number(event.target.value)),
                            )
                          }
                        />
                        <span className={css["unitBadge"]}>
                          {ingredient?.unit ?? "-"}
                        </span>
                        <button
                          className={css["deleteButton"]}
                          type="button"
                          onClick={() => removeMealIngredient(recipeRow.id)}
                        >
                          Видалити
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className={css["emptyState"]}>
                  Для цієї страви ще немає інгредієнтів.
                </div>
              )}

              <button
                className={css["addRowButton"]}
                disabled={isAddDisabled}
                type="button"
                onClick={addIngredientToSelectedMeal}
              >
                +
              </button>
            </div>
          </div>
        ) : (
          <div className={css["emptyState"]}>Спочатку додайте страви.</div>
        )}
      </section>

      <section className={css["section"]}>
        <div className={css["sectionHeader"]}>
          <h2>Рецепти по стравах</h2>
        </div>

        {recipeCards.length > 0 ? (
          <div className={css["recipesGrid"]}>
            {recipeCards.map((recipe) => {
              return (
                <article className={css["recipeCard"]} key={recipe.meal.id}>
                  <div className={css["recipeHeader"]}>
                    <h3>{recipe.meal.name}</h3>
                    <span>{recipe.ingredients.length}</span>
                  </div>

                  <ul className={css["recipeIngredients"]}>
                    {recipe.ingredients.map((recipeIngredient) => {
                      const ingredient = ingredientsById.get(
                        recipeIngredient.ingredientId,
                      );

                      return (
                        <li
                          className={css["recipeIngredient"]}
                          key={recipeIngredient.id}
                        >
                          <span>{ingredient?.name ?? "Інгредієнт не знайдено"}</span>
                          <small>
                            {recipeIngredient.amount} {ingredient?.unit ?? ""}
                          </small>
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
            Додайте інгредієнти до страв, щоб побачити рецепти.
          </div>
        )}
      </section>
    </main>
  );
};

export default RecipesManager;
