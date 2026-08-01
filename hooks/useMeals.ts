"use client";

import { useCallback, useMemo } from "react";
import { useMealStore } from "@/stores/meals";
import { Ingredient, MealIngredient, MealPlan, MealType } from "@/types/meals";

const normalizeSearchValue = (value: string) => value.trim().toLowerCase();

const includesSearch = (value: string | number | undefined, search: string) => {
  const normalizedSearch = normalizeSearchValue(search);

  if (!normalizedSearch) {
    return true;
  }

  return String(value ?? "").toLowerCase().includes(normalizedSearch);
};

export const useMeals = () => {
  const store = useMealStore();

  const ingredientsById = useMemo(() => {
    return new Map(store.ingredients.map((ingredient) => [ingredient.id, ingredient]));
  }, [store.ingredients]);

  const mealsById = useMemo(() => {
    return new Map(store.meals.map((meal) => [meal.id, meal]));
  }, [store.meals]);

  const mealIngredientsByMealId = useMemo(() => {
    return store.mealIngredients.reduce<Record<string, MealIngredient[]>>(
      (acc, mealIngredient) => {
        acc[mealIngredient.mealId] = [
          ...(acc[mealIngredient.mealId] ?? []),
          mealIngredient,
        ];
        return acc;
      },
      {},
    );
  }, [store.mealIngredients]);

  const mealPlansByDay = useMemo(() => {
    return store.mealPlans.reduce<Record<number, MealPlan[]>>((acc, mealPlan) => {
      acc[mealPlan.day] = [...(acc[mealPlan.day] ?? []), mealPlan];
      return acc;
    }, {});
  }, [store.mealPlans]);

  const sortedIngredients = useMemo(() => {
    return [...store.ingredients].sort((firstIngredient, secondIngredient) => {
      return firstIngredient.name.localeCompare(secondIngredient.name, "uk");
    });
  }, [store.ingredients]);

  const sortedMeals = useMemo(() => {
    return [...store.meals].sort((firstMeal, secondMeal) => {
      return firstMeal.name.localeCompare(secondMeal.name, "uk");
    });
  }, [store.meals]);

  const sortedMealPlans = useMemo(() => {
    return [...store.mealPlans].sort((firstPlan, secondPlan) => {
      return firstPlan.day - secondPlan.day;
    });
  }, [store.mealPlans]);

  const getIngredientById = useCallback(
    (id: string) => ingredientsById.get(id),
    [ingredientsById],
  );

  const getMealById = useCallback((id: string) => mealsById.get(id), [mealsById]);

  const getMealIngredientsByMealId = useCallback(
    (mealId: string) => mealIngredientsByMealId[mealId] ?? [],
    [mealIngredientsByMealId],
  );

  const getMealPlanById = useCallback(
    (id: string) => store.mealPlans.find((mealPlan) => mealPlan.id === id),
    [store.mealPlans],
  );

  const getMealPlansByDay = useCallback(
    (day: number) => mealPlansByDay[day] ?? [],
    [mealPlansByDay],
  );

  const getMealsByType = useCallback(
    (type: MealType) => store.meals.filter((meal) => meal.type === type),
    [store.meals],
  );

  const searchIngredients = useCallback(
    (search: string) => {
      return sortedIngredients.filter((ingredient) => {
        return (
          includesSearch(ingredient.name, search) ||
          includesSearch(ingredient.unit, search) ||
          includesSearch(ingredient.weight, search)
        );
      });
    },
    [sortedIngredients],
  );

  const searchMeals = useCallback(
    (search: string) => {
      return sortedMeals.filter((meal) => {
        return (
          includesSearch(meal.name, search) ||
          includesSearch(meal.type, search) ||
          includesSearch(meal.notes, search)
        );
      });
    },
    [sortedMeals],
  );

  const getRecipeForMeal = useCallback(
    (mealId: string) => {
      return getMealIngredientsByMealId(mealId).map((mealIngredient) => {
        return {
          ...mealIngredient,
          ingredient: ingredientsById.get(mealIngredient.ingredientId),
        };
      });
    },
    [getMealIngredientsByMealId, ingredientsById],
  );

  const getMealPlanDetailsByDay = useCallback(
    (day: number) => {
      return getMealPlansByDay(day).map((mealPlan) => {
        return {
          ...mealPlan,
          meal: mealsById.get(mealPlan.mealId),
        };
      });
    },
    [getMealPlansByDay, mealsById],
  );

  const getRequiredIngredients = useCallback(() => {
    return store.mealPlans.reduce<Record<string, Ingredient & { amount: number }>>(
      (acc, mealPlan) => {
        const recipe = mealIngredientsByMealId[mealPlan.mealId] ?? [];

        recipe.forEach((mealIngredient) => {
          const ingredient = ingredientsById.get(mealIngredient.ingredientId);

          if (!ingredient) {
            return;
          }

          acc[ingredient.id] = {
            ...ingredient,
            amount: (acc[ingredient.id]?.amount ?? 0) + mealIngredient.amount,
          };
        });

        return acc;
      },
      {},
    );
  }, [store.mealPlans, mealIngredientsByMealId, ingredientsById]);

  return {
    ingredients: store.ingredients,
    meals: store.meals,
    mealIngredients: store.mealIngredients,
    mealPlans: store.mealPlans,
    sortedIngredients,
    sortedMeals,
    sortedMealPlans,
    ingredientsById,
    mealsById,
    mealIngredientsByMealId,
    mealPlansByDay,
    ingredientsCount: store.ingredients.length,
    mealsCount: store.meals.length,
    mealPlansCount: store.mealPlans.length,
    hasIngredients: store.ingredients.length > 0,
    hasMeals: store.meals.length > 0,
    hasMealPlans: store.mealPlans.length > 0,
    addIngredient: store.addIngredient,
    removeIngredient: store.removeIngredient,
    updateIngredient: store.updateIngredient,
    setIngredients: store.setIngredients,
    clearIngredients: store.clearIngredients,
    addMeal: store.addMeal,
    removeMeal: store.removeMeal,
    updateMeal: store.updateMeal,
    setMeals: store.setMeals,
    clearMeals: store.clearMeals,
    addMealIngredient: store.addMealIngredient,
    removeMealIngredient: store.removeMealIngredient,
    updateMealIngredient: store.updateMealIngredient,
    setMealIngredients: store.setMealIngredients,
    clearMealIngredients: store.clearMealIngredients,
    addMealPlan: store.addMealPlan,
    removeMealPlan: store.removeMealPlan,
    updateMealPlan: store.updateMealPlan,
    setMealPlans: store.setMealPlans,
    clearMealPlans: store.clearMealPlans,
    getIngredientById,
    getMealById,
    getMealIngredientsByMealId,
    getMealPlanById,
    getMealPlansByDay,
    getMealsByType,
    searchIngredients,
    searchMeals,
    getRecipeForMeal,
    getMealPlanDetailsByDay,
    getRequiredIngredients,
  };
};

export const useIngredient = (id: string) => {
  return useMealStore(
    useCallback(
      (store) => store.ingredients.find((ingredient) => ingredient.id === id),
      [id],
    ),
  );
};

export const useMeal = (id: string) => {
  return useMealStore(
    useCallback((store) => store.meals.find((meal) => meal.id === id), [id]),
  );
};
