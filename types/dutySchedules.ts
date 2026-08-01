import { MealType } from "./meals";

export interface DutySchedule {
  id: string;
  day: number;
  memberIds: string[];
}

export interface FoodAssignment {
  id: string;
  memberId: string;
  ingredientId: string;
  totalAmount: number;
  currentAmount: number;
}

export interface FoodPickup {
  id: string;
  day: number;
  mealType: MealType;
  memberId: string;
  ingredientId: string;
  amount: number;
  notes?: string;
}
