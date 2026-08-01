"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useDutyScheduleStore } from "@/stores/dutySchedule";
import { useMealStore } from "@/stores/meals";
import { useMemberStore } from "@/stores/members";
import { useSettingsStore } from "@/stores/settings";
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
import { CampSettings } from "@/types/settings";
import css from "./Home.module.css";

type ImportData = {
  settings: CampSettings;
  members: Member[];
  ingredients: Ingredient[];
  meals: Meal[];
  mealIngredients: MealIngredient[];
  mealPlans: MealPlan[];
  dutySchedules: DutySchedule[];
  foodAssignments: FoodAssignment[];
  foodPickups: FoodPickup[];
};

const units: Unit[] = ["кг", "г", "шт", "банка", "пакетик", "пачка"];
const genders: Gender[] = ["male", "female"];
const mealTypes: MealType[] = ["Сніданок", "Обід", "Вечеря", "Перекус"];

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

const isDateString = (value: unknown) => {
  return isString(value) && (value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value));
};

const hasUniqueIds = (items: Array<{ id: string }>) => {
  return new Set(items.map((item) => item.id)).size === items.length;
};

const parseArray = <Item,>(
  data: Record<string, unknown>,
  key: Exclude<keyof ImportData, "settings">,
  parser: (item: unknown) => Item | string,
) => {
  const value = data[key];

  if (!Array.isArray(value)) {
    return `${String(key)} має бути масивом`;
  }

  const result: Item[] = [];

  for (const item of value) {
    const parsedItem = parser(item);

    if (typeof parsedItem === "string") {
      return parsedItem;
    }

    result.push(parsedItem);
  }

  return result;
};

const parseSettings = (value: unknown): CampSettings | string => {
  if (value === undefined) {
    return {
      startDate: "",
      endDate: "",
      startPoint: "",
      endPoint: "",
    };
  }

  if (!isRecord(value)) {
    return "settings має бути обʼєктом";
  }

  if (!isDateString(value.startDate) || !isDateString(value.endDate)) {
    return "Некоректні налаштування: startDate і endDate мають бути YYYY-MM-DD або порожнім рядком";
  }

  if (!isOptionalString(value.startPoint) || !isOptionalString(value.endPoint)) {
    return "Некоректні налаштування: startPoint і endPoint мають бути рядками";
  }

  if (
    value.startDate &&
    value.endDate &&
    String(value.startDate) > String(value.endDate)
  ) {
    return "Дата початку походу не може бути пізнішою за дату завершення";
  }

  return {
    startDate: String(value.startDate),
    endDate: String(value.endDate),
    startPoint: value.startPoint ? String(value.startPoint) : "",
    endPoint: value.endPoint ? String(value.endPoint) : "",
  };
};

const parseMember = (value: unknown): Member | string => {
  if (!isRecord(value)) {
    return "Кожен учасник має бути обʼєктом";
  }

  if (
    !isString(value.id) ||
    !isString(value.fullName) ||
    !genders.includes(value.gender as Gender) ||
    !isPositiveInteger(value.teamNumber) ||
    !isOptionalString(value.phoneNumber) ||
    !isOptionalString(value.email) ||
    !isOptionalString(value.notes)
  ) {
    return "Некоректний учасник: потрібні id, fullName, gender, teamNumber";
  }

  return {
    id: value.id,
    fullName: value.fullName,
    gender: value.gender as Gender,
    phoneNumber: value.phoneNumber,
    email: value.email,
    notes: value.notes,
    teamNumber: Number(value.teamNumber),
  };
};

const parseIngredient = (value: unknown): Ingredient | string => {
  if (!isRecord(value)) {
    return "Кожен інгредієнт має бути обʼєктом";
  }

  if (
    !isString(value.id) ||
    !isString(value.name) ||
    !units.includes(value.unit as Unit) ||
    !isNonNegativeNumber(value.weight)
  ) {
    return "Некоректний інгредієнт: потрібні id, name, unit, weight";
  }

  return {
    id: value.id,
    name: value.name,
    unit: value.unit as Unit,
    weight: Number(value.weight),
  };
};

const parseMeal = (value: unknown): Meal | string => {
  if (!isRecord(value)) {
    return "Кожна страва має бути обʼєктом";
  }

  if (
    !isString(value.id) ||
    !isString(value.name) ||
    !isOptionalString(value.notes)
  ) {
    return "Некоректна страва: потрібні id, name";
  }

  return {
    id: value.id,
    name: value.name,
    notes: value.notes,
  };
};

const parseMealIngredient = (value: unknown): MealIngredient | string => {
  if (!isRecord(value)) {
    return "Кожен рядок рецепту має бути обʼєктом";
  }

  if (
    !isString(value.id) ||
    !isString(value.mealId) ||
    !isString(value.ingredientId) ||
    !isNonNegativeNumber(value.amount)
  ) {
    return "Некоректний рецепт: потрібні id, mealId, ingredientId, amount";
  }

  return {
    id: value.id,
    mealId: value.mealId,
    ingredientId: value.ingredientId,
    amount: Number(value.amount),
  };
};

const parseMealPlan = (value: unknown): MealPlan | string => {
  if (!isRecord(value)) {
    return "Кожен запис раціону має бути обʼєктом";
  }

  if (
    !isString(value.id) ||
    !isPositiveInteger(value.day) ||
    !isString(value.mealId) ||
    !mealTypes.includes(value.mealType as MealType)
  ) {
    return "Некоректний раціон: потрібні id, day, mealId, mealType";
  }

  return {
    id: value.id,
    day: Number(value.day),
    mealId: value.mealId,
    mealType: value.mealType as MealType,
  };
};

const parseDutySchedule = (value: unknown): DutySchedule | string => {
  if (!isRecord(value)) {
    return "Кожне чергування має бути обʼєктом";
  }

  if (
    !isString(value.id) ||
    !isPositiveInteger(value.day) ||
    !Array.isArray(value.memberIds) ||
    !value.memberIds.every(isString)
  ) {
    return "Некоректне чергування: потрібні id, day, memberIds";
  }

  return {
    id: value.id,
    day: Number(value.day),
    memberIds: value.memberIds,
  };
};

const parseFoodAssignment = (value: unknown): FoodAssignment | string => {
  if (!isRecord(value)) {
    return "Кожен розподіл продуктів має бути обʼєктом";
  }

  if (
    !isString(value.id) ||
    !isString(value.memberId) ||
    !isString(value.ingredientId) ||
    !isNonNegativeNumber(value.totalAmount) ||
    !isNonNegativeNumber(value.currentAmount)
  ) {
    return "Некоректний розподіл продуктів";
  }

  return {
    id: value.id,
    memberId: value.memberId,
    ingredientId: value.ingredientId,
    totalAmount: Number(value.totalAmount),
    currentAmount: Number(value.currentAmount),
  };
};

const parseFoodPickup = (value: unknown): FoodPickup | string => {
  if (!isRecord(value)) {
    return "Кожен забір продуктів має бути обʼєктом";
  }

  if (
    !isString(value.id) ||
    !isPositiveInteger(value.day) ||
    !mealTypes.includes(value.mealType as MealType) ||
    !isString(value.memberId) ||
    !isString(value.ingredientId) ||
    !isNonNegativeNumber(value.amount) ||
    !isOptionalString(value.notes)
  ) {
    return "Некоректний забір продуктів";
  }

  return {
    id: value.id,
    day: Number(value.day),
    mealType: value.mealType as MealType,
    memberId: value.memberId,
    ingredientId: value.ingredientId,
    amount: Number(value.amount),
    notes: value.notes,
  };
};

const validateReferences = (data: ImportData) => {
  const memberIds = new Set(data.members.map((member) => member.id));
  const ingredientIds = new Set(
    data.ingredients.map((ingredient) => ingredient.id),
  );
  const mealIds = new Set(data.meals.map((meal) => meal.id));

  if (!data.mealIngredients.every((row) => mealIds.has(row.mealId))) {
    return "У рецептах є посилання на неіснуючу страву";
  }

  if (
    !data.mealIngredients.every((row) => ingredientIds.has(row.ingredientId))
  ) {
    return "У рецептах є посилання на неіснуючий інгредієнт";
  }

  if (!data.mealPlans.every((mealPlan) => mealIds.has(mealPlan.mealId))) {
    return "У раціоні є посилання на неіснуючу страву";
  }

  if (
    !data.dutySchedules.every((dutySchedule) => {
      return dutySchedule.memberIds.every((memberId) =>
        memberIds.has(memberId),
      );
    })
  ) {
    return "У чергуваннях є посилання на неіснуючого учасника";
  }

  if (!data.foodAssignments.every((row) => memberIds.has(row.memberId))) {
    return "У розподілі продуктів є посилання на неіснуючого учасника";
  }

  if (
    !data.foodAssignments.every((row) => ingredientIds.has(row.ingredientId))
  ) {
    return "У розподілі продуктів є посилання на неіснуючий інгредієнт";
  }

  if (!data.foodPickups.every((row) => memberIds.has(row.memberId))) {
    return "У заборі продуктів є посилання на неіснуючого учасника";
  }

  if (!data.foodPickups.every((row) => ingredientIds.has(row.ingredientId))) {
    return "У заборі продуктів є посилання на неіснуючий інгредієнт";
  }

  return "";
};

const validateImportData = (value: unknown): ImportData | string => {
  if (!isRecord(value)) {
    return "JSON має бути обʼєктом";
  }

  const data = isRecord(value.data) ? value.data : value;
  const settings = parseSettings(data.settings);
  const members = parseArray(data, "members", parseMember);
  const ingredients = parseArray(data, "ingredients", parseIngredient);
  const meals = parseArray(data, "meals", parseMeal);
  const mealIngredients = parseArray(
    data,
    "mealIngredients",
    parseMealIngredient,
  );
  const mealPlans = parseArray(data, "mealPlans", parseMealPlan);
  const dutySchedules = parseArray(data, "dutySchedules", parseDutySchedule);
  const foodAssignments = parseArray(
    data,
    "foodAssignments",
    parseFoodAssignment,
  );
  const foodPickups = parseArray(data, "foodPickups", parseFoodPickup);

  const parsedValues = [
    settings,
    members,
    ingredients,
    meals,
    mealIngredients,
    mealPlans,
    dutySchedules,
    foodAssignments,
    foodPickups,
  ];
  const error = parsedValues.find(
    (parsedValue) => typeof parsedValue === "string",
  );

  if (typeof error === "string") {
    return error;
  }

  const importData: ImportData = {
    settings: settings as CampSettings,
    members: members as Member[],
    ingredients: ingredients as Ingredient[],
    meals: meals as Meal[],
    mealIngredients: mealIngredients as MealIngredient[],
    mealPlans: mealPlans as MealPlan[],
    dutySchedules: dutySchedules as DutySchedule[],
    foodAssignments: foodAssignments as FoodAssignment[],
    foodPickups: foodPickups as FoodPickup[],
  };

  if (
    !hasUniqueIds(importData.members) ||
    !hasUniqueIds(importData.ingredients) ||
    !hasUniqueIds(importData.meals) ||
    !hasUniqueIds(importData.mealIngredients) ||
    !hasUniqueIds(importData.mealPlans) ||
    !hasUniqueIds(importData.dutySchedules) ||
    !hasUniqueIds(importData.foodAssignments) ||
    !hasUniqueIds(importData.foodPickups)
  ) {
    return "У кожному масиві id мають бути унікальними";
  }

  return validateReferences(importData) || importData;
};

const replaceStoreData = (data: ImportData) => {
  const memberStore = useMemberStore.getState();
  const mealStore = useMealStore.getState();
  const dutyScheduleStore = useDutyScheduleStore.getState();
  const settingsStore = useSettingsStore.getState();

  settingsStore.clearSettings();
  memberStore.clearMembers();
  mealStore.clearIngredients();
  mealStore.clearMeals();
  mealStore.clearMealIngredients();
  mealStore.clearMealPlans();
  dutyScheduleStore.clearDutySchedules();
  dutyScheduleStore.clearFoodAssignments();
  dutyScheduleStore.clearFoodPickups();

  settingsStore.setSettings(data.settings);
  memberStore.setMembers(data.members);
  mealStore.setIngredients(data.ingredients);
  mealStore.setMeals(data.meals);
  mealStore.setMealIngredients(data.mealIngredients);
  mealStore.setMealPlans(data.mealPlans);
  dutyScheduleStore.setDutySchedules(data.dutySchedules);
  dutyScheduleStore.setFoodAssignments(data.foodAssignments);
  dutyScheduleStore.setFoodPickups(data.foodPickups);
};

const HomeImportButton = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setMessage("");
    setError("");

    if (!file) {
      return;
    }

    try {
      const parsedJson: unknown = JSON.parse(await file.text());
      const validatedData = validateImportData(parsedJson);

      if (typeof validatedData === "string") {
        setError(validatedData);
        return;
      }

      replaceStoreData(validatedData);
      setMessage("Дані успішно імпортовано.");
    } catch {
      setError("Файл має містити валідний JSON.");
    }
  };

  return (
    <>
      <button
        className={css["importButton"]}
        type="button"
        onClick={() => setIsOpen(true)}
      >
        Імпортувати JSON
      </button>

      {isOpen ? (
        <div className={css["modalBackdrop"]} role="presentation">
          <div
            aria-modal="true"
            className={css["modal"]}
            role="dialog"
            aria-labelledby="import-json-title"
          >
            <div className={css["modalHeader"]}>
              <h2 id="import-json-title">Імпорт JSON</h2>
              <button
                className={css["modalCloseButton"]}
                type="button"
                onClick={() => setIsOpen(false)}
              >
                Закрити
              </button>
            </div>

            <div className={css["modalBody"]}>
              <p>
                Файл має бути JSON-обʼєктом з полем <code>data</code>, або самим
                обʼєктом даних. Усі масиви обовʼязкові.
              </p>

              <pre className={css["jsonExample"]}>
                {`{
  "version": 1,
  "data": {
    "settings": {
      "startDate": "2026-08-01",
      "endDate": "2026-08-07",
      "startPoint": "село Ясіня",
      "endPoint": "Мукачево"
    },
    "members": [
      {
        "id": "member-1",
        "fullName": "Іван Петренко",
        "gender": "male",
        "phoneNumber": "+380000000000",
        "email": "ivan@example.com",
        "notes": "Нотатка",
        "teamNumber": 1
      }
    ],
    "ingredients": [
      {
        "id": "ingredient-1",
        "name": "Картопля",
        "unit": "кг",
        "weight": 1
      }
    ],
    "meals": [
      {
        "id": "meal-1",
        "name": "Борщ",
        "notes": "Готувати на казані"
      }
    ],
    "mealIngredients": [
      {
        "id": "meal-ingredient-1",
        "mealId": "meal-1",
        "ingredientId": "ingredient-1",
        "amount": 2
      }
    ],
    "mealPlans": [
      {
        "id": "meal-plan-1",
        "day": 1,
        "mealId": "meal-1",
        "mealType": "Вечеря"
      }
    ],
    "dutySchedules": [
      {
        "id": "duty-schedule-1",
        "day": 1,
        "memberIds": ["member-1"]
      }
    ],
    "foodAssignments": [
      {
        "id": "food-assignment-1",
        "memberId": "member-1",
        "ingredientId": "ingredient-1",
        "totalAmount": 2,
        "currentAmount": 2
      }
    ],
    "foodPickups": [
      {
        "id": "food-pickup-1",
        "day": 1,
        "mealType": "Вечеря",
        "memberId": "member-1",
        "ingredientId": "ingredient-1",
        "amount": 2,
        "notes": "Забрати перед вечерею"
      }
    ]
  }
}`}
              </pre>

              <p>
                Id мають бути унікальними у межах кожного масиву. Посилання
                <code> mealId</code>, <code>ingredientId</code> і
                <code> memberId</code> мають вести на існуючі записи.
              </p>

              <p>
                Якщо файл валідний, поточні дані будуть повністю очищені, а
                потім замінені даними з файлу.
              </p>

              {error ? <div className={css["importError"]}>{error}</div> : null}
              {message ? (
                <div className={css["importSuccess"]}>{message}</div>
              ) : null}
            </div>

            <div className={css["modalFooter"]}>
              <input
                ref={inputRef}
                accept="application/json,.json"
                hidden
                type="file"
                onChange={handleFileChange}
              />
              <button
                className={css["exportButton"]}
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                Відкрити файл
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default HomeImportButton;
