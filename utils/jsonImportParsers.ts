import {
  DutySchedule,
  FoodAssignment,
  FoodPickup,
} from "@/types/dutySchedules";
import {
  Ingredient,
  Meal,
  MealIngredient,
  MealPlan,
  MealType,
  Unit,
} from "@/types/meals";
import { Gender, Member } from "@/types/members";

const units: Unit[] = ["кг", "г", "шт", "банка", "пакетик", "пачка"];
const genders: Gender[] = ["male", "female"];
const mealTypes: MealType[] = ["Сніданок", "Обід", "Вечеря", "Перекус"];

const createId = () => crypto.randomUUID();

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isString = (value: unknown) => typeof value === "string";

const isOptionalString = (value: unknown) => {
  return value === undefined || isString(value);
};

const isPositiveInteger = (value: unknown) => {
  return Number.isInteger(value) && Number(value) >= 1;
};

const isNonNegativeNumber = (value: unknown) => {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
};

const getId = (value: unknown) => {
  return isString(value) && value.trim() ? value : createId();
};

export const parseImportedMember = (value: unknown): Member | string => {
  if (!isRecord(value)) {
    return "Кожен учасник має бути обʼєктом";
  }

  if (
    !isString(value.fullName) ||
    !genders.includes(value.gender as Gender) ||
    !isPositiveInteger(value.teamNumber) ||
    !isOptionalString(value.phoneNumber) ||
    !isOptionalString(value.email) ||
    !isOptionalString(value.notes)
  ) {
    return "Некоректний учасник: потрібні fullName, gender, teamNumber";
  }

  return {
    id: getId(value.id),
    fullName: value.fullName.trim(),
    gender: value.gender as Gender,
    phoneNumber: value.phoneNumber,
    email: value.email,
    notes: value.notes,
    teamNumber: Number(value.teamNumber),
  };
};

export const parseImportedIngredient = (value: unknown): Ingredient | string => {
  if (!isRecord(value)) {
    return "Кожен інгредієнт має бути обʼєктом";
  }

  if (
    !isString(value.name) ||
    !units.includes(value.unit as Unit) ||
    !isNonNegativeNumber(value.weight)
  ) {
    return "Некоректний інгредієнт: потрібні name, unit, weight";
  }

  return {
    id: getId(value.id),
    name: value.name.trim(),
    unit: value.unit as Unit,
    weight: Number(value.weight),
  };
};

export const parseImportedMeal = (value: unknown): Meal | string => {
  if (!isRecord(value)) {
    return "Кожна страва має бути обʼєктом";
  }

  if (!isString(value.name) || !isOptionalString(value.notes)) {
    return "Некоректна страва: потрібне поле name";
  }

  return {
    id: getId(value.id),
    name: value.name.trim(),
    notes: value.notes,
  };
};

export const parseImportedMealIngredient = (
  value: unknown,
): MealIngredient | string => {
  if (!isRecord(value)) {
    return "Кожен рядок рецепту має бути обʼєктом";
  }

  if (
    !isString(value.mealId) ||
    !isString(value.ingredientId) ||
    !isNonNegativeNumber(value.amount)
  ) {
    return "Некоректний рецепт: потрібні mealId, ingredientId, amount";
  }

  return {
    id: getId(value.id),
    mealId: value.mealId,
    ingredientId: value.ingredientId,
    amount: Number(value.amount),
  };
};

export const parseImportedMealPlan = (value: unknown): MealPlan | string => {
  if (!isRecord(value)) {
    return "Кожен запис раціону має бути обʼєктом";
  }

  if (
    !isPositiveInteger(value.day) ||
    !isString(value.mealId) ||
    !mealTypes.includes(value.mealType as MealType)
  ) {
    return "Некоректний раціон: потрібні day, mealId, mealType";
  }

  return {
    id: getId(value.id),
    day: Number(value.day),
    mealId: value.mealId,
    mealType: value.mealType as MealType,
  };
};

export const parseImportedDutySchedule = (
  value: unknown,
): DutySchedule | string => {
  if (!isRecord(value)) {
    return "Кожне чергування має бути обʼєктом";
  }

  if (
    !isPositiveInteger(value.day) ||
    !Array.isArray(value.memberIds) ||
    !value.memberIds.every(isString)
  ) {
    return "Некоректне чергування: потрібні day, memberIds";
  }

  return {
    id: getId(value.id),
    day: Number(value.day),
    memberIds: value.memberIds,
  };
};

export const parseImportedFoodAssignment = (
  value: unknown,
): FoodAssignment | string => {
  if (!isRecord(value)) {
    return "Кожен розподіл продуктів має бути обʼєктом";
  }

  if (
    !isString(value.memberId) ||
    !isString(value.ingredientId) ||
    !isNonNegativeNumber(value.totalAmount)
  ) {
    return "Некоректний розподіл продуктів: потрібні memberId, ingredientId, totalAmount";
  }

  return {
    id: getId(value.id),
    memberId: value.memberId,
    ingredientId: value.ingredientId,
    totalAmount: Number(value.totalAmount),
    currentAmount: isNonNegativeNumber(value.currentAmount)
      ? Number(value.currentAmount)
      : Number(value.totalAmount),
  };
};

export const parseImportedFoodPickup = (value: unknown): FoodPickup | string => {
  if (!isRecord(value)) {
    return "Кожен забір продуктів має бути обʼєктом";
  }

  if (
    !isPositiveInteger(value.day) ||
    !mealTypes.includes(value.mealType as MealType) ||
    !isString(value.memberId) ||
    !isString(value.ingredientId) ||
    !isNonNegativeNumber(value.amount) ||
    !isOptionalString(value.notes)
  ) {
    return "Некоректний забір продуктів: потрібні day, mealType, memberId, ingredientId, amount";
  }

  return {
    id: getId(value.id),
    day: Number(value.day),
    mealType: value.mealType as MealType,
    memberId: value.memberId,
    ingredientId: value.ingredientId,
    amount: Number(value.amount),
    notes: value.notes,
  };
};
