import {
  DutySchedule,
  FoodAssignment,
  FoodPickup,
} from "@/types/dutySchedules";
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { persist } from "zustand/middleware";

interface DutyScheduleStore {
  dutySchedules: DutySchedule[];
  foodAssignments: FoodAssignment[];
  foodPickups: FoodPickup[];
  addDutySchedule: (dutySchedule: DutySchedule) => void;
  removeDutySchedule: (id: string) => void;
  updateDutySchedule: (id: string, body: Partial<DutySchedule>) => void;
  setDutySchedules: (dutySchedules: DutySchedule[]) => void;
  clearDutySchedules: () => void;
  addFoodAssignment: (foodAssignment: FoodAssignment) => void;
  removeFoodAssignment: (id: string) => void;
  updateFoodAssignment: (id: string, body: Partial<FoodAssignment>) => void;
  setFoodAssignments: (foodAssignments: FoodAssignment[]) => void;
  clearFoodAssignments: () => void;
  addFoodPickup: (foodPickup: FoodPickup) => void;
  removeFoodPickup: (id: string) => void;
  updateFoodPickup: (id: string, body: Partial<FoodPickup>) => void;
  setFoodPickups: (foodPickups: FoodPickup[]) => void;
  clearFoodPickups: () => void;
}

export const useDutyScheduleStore = create<DutyScheduleStore>()(
  persist(
    (setStore) => {
      return {
        dutySchedules: [],
        foodAssignments: [],
        foodPickups: [],

        addDutySchedule: (dutySchedule) => {
          const copy = { ...dutySchedule, id: uuidv4() };
          setStore((store) => {
            return { dutySchedules: [...store.dutySchedules, copy] };
          });
        },

        removeDutySchedule: (id) => {
          setStore((store) => {
            return {
              dutySchedules: store.dutySchedules.filter(
                (dutySchedule) => dutySchedule.id !== id,
              ),
            };
          });
        },

        updateDutySchedule: (id, body) => {
          setStore((store) => {
            return {
              dutySchedules: store.dutySchedules.map((dutySchedule) => {
                if (dutySchedule.id !== id) {
                  return dutySchedule;
                }

                return { ...dutySchedule, ...body, id: dutySchedule.id };
              }),
            };
          });
        },

        setDutySchedules: (dutySchedules) => {
          setStore({ dutySchedules });
        },

        clearDutySchedules: () => {
          setStore({ dutySchedules: [] });
        },

        addFoodAssignment: (foodAssignment) => {
          const copy = { ...foodAssignment, id: uuidv4() };
          setStore((store) => {
            return {
              foodAssignments: [...store.foodAssignments, copy],
            };
          });
        },

        removeFoodAssignment: (id) => {
          setStore((store) => {
            return {
              foodAssignments: store.foodAssignments.filter(
                (foodAssignment) => foodAssignment.id !== id,
              ),
            };
          });
        },

        updateFoodAssignment: (id, body) => {
          setStore((store) => {
            return {
              foodAssignments: store.foodAssignments.map((foodAssignment) => {
                if (foodAssignment.id !== id) {
                  return foodAssignment;
                }

                return { ...foodAssignment, ...body, id: foodAssignment.id };
              }),
            };
          });
        },

        setFoodAssignments: (foodAssignments) => {
          setStore({ foodAssignments });
        },

        clearFoodAssignments: () => {
          setStore({ foodAssignments: [] });
        },

        addFoodPickup: (foodPickup) => {
          const copy = { ...foodPickup, id: uuidv4() };
          setStore((store) => {
            return { foodPickups: [...store.foodPickups, copy] };
          });
        },

        removeFoodPickup: (id) => {
          setStore((store) => {
            return {
              foodPickups: store.foodPickups.filter(
                (foodPickup) => foodPickup.id !== id,
              ),
            };
          });
        },

        updateFoodPickup: (id, body) => {
          setStore((store) => {
            return {
              foodPickups: store.foodPickups.map((foodPickup) => {
                if (foodPickup.id !== id) {
                  return foodPickup;
                }

                return { ...foodPickup, ...body, id: foodPickup.id };
              }),
            };
          });
        },

        setFoodPickups: (foodPickups) => {
          setStore({ foodPickups });
        },

        clearFoodPickups: () => {
          setStore({ foodPickups: [] });
        },
      };
    },
    { name: "DutySchedule" },
  ),
);
