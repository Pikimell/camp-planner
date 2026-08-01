export type Unit = "кг" | "г" | "шт" | "банка" | "пакетик" | "пачка";
export type MealType = "Сніданок" | "Вечеря" | "Обід" | "Перекус";

export interface Ingredient {
  id: string;
  name: string;
  unit: Unit;
  weight: number;
}

export interface Meal {
  id: string;
  name: string;
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
  mealType: MealType;
}
