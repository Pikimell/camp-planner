export interface DutySchedule {
  id: string;
  day: number;
  memberIds: string[];
}

export interface FoodAssignment {
  id: string;
  memberId: string;
  ingredientId: string;
  amount: number;
}
