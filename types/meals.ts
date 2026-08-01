export type Unit = "кг" | "г" | "шт";
export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

export interface Ingredient {
  id: string;
  name: string;
  unit: Unit;
  weight: number;
}

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  notes?: string;
}

export interface MealIngredient {
  id: string;
  mealId: string;
  ingredientId: string;
  amount: number;
}

export interface MealPlan {
  id: string;
  day: number;
  mealId: string;
}
