import { Ingredient, Meal, MealIngredient, MealPlan } from "@/types/meals";
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { persist } from "zustand/middleware";

interface MealStore {
  ingredients: Ingredient[];
  meals: Meal[];
  mealIngredients: MealIngredient[];
  mealPlans: MealPlan[];
  addIngredient: (ingredient: Ingredient) => void;
  removeIngredient: (id: string) => void;
  updateIngredient: (id: string, body: Partial<Ingredient>) => void;
  setIngredients: (ingredients: Ingredient[]) => void;
  clearIngredients: () => void;
  addMeal: (meal: Meal) => void;
  removeMeal: (id: string) => void;
  updateMeal: (id: string, body: Partial<Meal>) => void;
  setMeals: (meals: Meal[]) => void;
  clearMeals: () => void;
  addMealIngredient: (mealIngredient: MealIngredient) => void;
  removeMealIngredient: (id: string) => void;
  updateMealIngredient: (id: string, body: Partial<MealIngredient>) => void;
  setMealIngredients: (mealIngredients: MealIngredient[]) => void;
  clearMealIngredients: () => void;
  addMealPlan: (mealPlan: MealPlan) => void;
  removeMealPlan: (id: string) => void;
  updateMealPlan: (id: string, body: Partial<MealPlan>) => void;
  setMealPlans: (mealPlans: MealPlan[]) => void;
  clearMealPlans: () => void;
}

export const useMealStore = create<MealStore>()(
  persist(
    (setStore) => {
      return {
        ingredients: [],
        meals: [],
        mealIngredients: [],
        mealPlans: [],

        addIngredient: (ingredient) => {
          const copy = { ...ingredient, id: uuidv4() };
          setStore((store) => {
            return { ingredients: [...store.ingredients, copy] };
          });
        },

        removeIngredient: (id) => {
          setStore((store) => {
            return {
              ingredients: store.ingredients.filter(
                (ingredient) => ingredient.id !== id,
              ),
            };
          });
        },

        updateIngredient: (id, body) => {
          setStore((store) => {
            return {
              ingredients: store.ingredients.map((ingredient) => {
                if (ingredient.id !== id) {
                  return ingredient;
                }

                return { ...ingredient, ...body, id: ingredient.id };
              }),
            };
          });
        },

        setIngredients: (ingredients) => {
          setStore({ ingredients });
        },

        clearIngredients: () => {
          setStore({ ingredients: [] });
        },

        addMeal: (meal) => {
          const copy = { ...meal, id: uuidv4() };
          setStore((store) => {
            return { meals: [...store.meals, copy] };
          });
        },

        removeMeal: (id) => {
          setStore((store) => {
            return {
              meals: store.meals.filter((meal) => meal.id !== id),
            };
          });
        },

        updateMeal: (id, body) => {
          setStore((store) => {
            return {
              meals: store.meals.map((meal) => {
                if (meal.id !== id) {
                  return meal;
                }

                return { ...meal, ...body, id: meal.id };
              }),
            };
          });
        },

        setMeals: (meals) => {
          setStore({ meals });
        },

        clearMeals: () => {
          setStore({ meals: [] });
        },

        addMealIngredient: (mealIngredient) => {
          const copy = { ...mealIngredient, id: uuidv4() };
          setStore((store) => {
            return {
              mealIngredients: [...store.mealIngredients, copy],
            };
          });
        },

        removeMealIngredient: (id) => {
          setStore((store) => {
            return {
              mealIngredients: store.mealIngredients.filter(
                (mealIngredient) => mealIngredient.id !== id,
              ),
            };
          });
        },

        updateMealIngredient: (id, body) => {
          setStore((store) => {
            return {
              mealIngredients: store.mealIngredients.map((mealIngredient) => {
                if (mealIngredient.id !== id) {
                  return mealIngredient;
                }

                return { ...mealIngredient, ...body, id: mealIngredient.id };
              }),
            };
          });
        },

        setMealIngredients: (mealIngredients) => {
          setStore({ mealIngredients });
        },

        clearMealIngredients: () => {
          setStore({ mealIngredients: [] });
        },

        addMealPlan: (mealPlan) => {
          const copy = { ...mealPlan, id: uuidv4() };
          setStore((store) => {
            return { mealPlans: [...store.mealPlans, copy] };
          });
        },

        removeMealPlan: (id) => {
          setStore((store) => {
            return {
              mealPlans: store.mealPlans.filter(
                (mealPlan) => mealPlan.id !== id,
              ),
            };
          });
        },

        updateMealPlan: (id, body) => {
          setStore((store) => {
            return {
              mealPlans: store.mealPlans.map((mealPlan) => {
                if (mealPlan.id !== id) {
                  return mealPlan;
                }

                return { ...mealPlan, ...body, id: mealPlan.id };
              }),
            };
          });
        },

        setMealPlans: (mealPlans) => {
          setStore({ mealPlans });
        },

        clearMealPlans: () => {
          setStore({ mealPlans: [] });
        },
      };
    },
    { name: "MealStore" },
  ),
);
