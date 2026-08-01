"use client";

import { useCallback, useMemo } from "react";
import { useDutyScheduleStore } from "@/stores/dutySchedule";
import { useMealStore } from "@/stores/meals";
import { useMemberStore } from "@/stores/members";
import { DutySchedule, FoodAssignment, FoodPickup } from "@/types/dutySchedules";

const normalizeSearchValue = (value: string) => value.trim().toLowerCase();

const includesSearch = (value: string | number | undefined, search: string) => {
  const normalizedSearch = normalizeSearchValue(search);

  if (!normalizedSearch) {
    return true;
  }

  return String(value ?? "").toLowerCase().includes(normalizedSearch);
};

export const useDutySchedule = () => {
  const store = useDutyScheduleStore();
  const members = useMemberStore((memberStore) => memberStore.members);
  const ingredients = useMealStore((mealStore) => mealStore.ingredients);
  const { dutySchedules, foodAssignments, foodPickups } = store;

  const membersById = useMemo(() => {
    return new Map(members.map((member) => [member.id, member]));
  }, [members]);

  const ingredientsById = useMemo(() => {
    return new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  }, [ingredients]);

  const dutySchedulesById = useMemo(() => {
    return new Map(
      dutySchedules.map((dutySchedule) => [dutySchedule.id, dutySchedule]),
    );
  }, [dutySchedules]);

  const foodAssignmentsById = useMemo(() => {
    return new Map(
      foodAssignments.map((foodAssignment) => [
        foodAssignment.id,
        foodAssignment,
      ]),
    );
  }, [foodAssignments]);

  const foodPickupsById = useMemo(() => {
    return new Map(foodPickups.map((foodPickup) => [foodPickup.id, foodPickup]));
  }, [foodPickups]);

  const dutySchedulesByDay = useMemo(() => {
    return dutySchedules.reduce<Record<number, DutySchedule[]>>(
      (acc, dutySchedule) => {
        acc[dutySchedule.day] = [...(acc[dutySchedule.day] ?? []), dutySchedule];
        return acc;
      },
      {},
    );
  }, [dutySchedules]);

  const foodAssignmentsByMemberId = useMemo(() => {
    return foodAssignments.reduce<Record<string, FoodAssignment[]>>(
      (acc, foodAssignment) => {
        acc[foodAssignment.memberId] = [
          ...(acc[foodAssignment.memberId] ?? []),
          foodAssignment,
        ];
        return acc;
      },
      {},
    );
  }, [foodAssignments]);

  const foodPickupsByDay = useMemo(() => {
    return foodPickups.reduce<Record<number, FoodPickup[]>>(
      (acc, foodPickup) => {
        acc[foodPickup.day] = [...(acc[foodPickup.day] ?? []), foodPickup];
        return acc;
      },
      {},
    );
  }, [foodPickups]);

  const sortedDutySchedules = useMemo(() => {
    return [...dutySchedules].sort((firstSchedule, secondSchedule) => {
      return firstSchedule.day - secondSchedule.day;
    });
  }, [dutySchedules]);

  const getDutyScheduleById = useCallback(
    (id: string) => dutySchedulesById.get(id),
    [dutySchedulesById],
  );

  const getDutySchedulesByDay = useCallback(
    (day: number) => dutySchedulesByDay[day] ?? [],
    [dutySchedulesByDay],
  );

  const getDutyMembersByDay = useCallback(
    (day: number) => {
      return getDutySchedulesByDay(day).flatMap((dutySchedule) => {
        return dutySchedule.memberIds
          .map((memberId) => membersById.get(memberId))
          .filter(Boolean);
      });
    },
    [getDutySchedulesByDay, membersById],
  );

  const getFoodAssignmentById = useCallback(
    (id: string) => foodAssignmentsById.get(id),
    [foodAssignmentsById],
  );

  const getFoodAssignmentsByMemberId = useCallback(
    (memberId: string) => foodAssignmentsByMemberId[memberId] ?? [],
    [foodAssignmentsByMemberId],
  );

  const getFoodAssignmentsByIngredientId = useCallback(
    (ingredientId: string) => {
      return foodAssignments.filter((assignment) => {
        return assignment.ingredientId === ingredientId;
      });
    },
    [foodAssignments],
  );

  const getFoodPickupById = useCallback(
    (id: string) => foodPickupsById.get(id),
    [foodPickupsById],
  );

  const getFoodPickupsByDay = useCallback(
    (day: number) => foodPickupsByDay[day] ?? [],
    [foodPickupsByDay],
  );

  const searchDutySchedules = useCallback(
    (search: string) => {
      return sortedDutySchedules.filter((dutySchedule) => {
        const memberNames = dutySchedule.memberIds
          .map((memberId) => membersById.get(memberId)?.fullName)
          .join(" ");

        return includesSearch(dutySchedule.day, search) || includesSearch(memberNames, search);
      });
    },
    [sortedDutySchedules, membersById],
  );

  const searchFoodAssignments = useCallback(
    (search: string) => {
      return foodAssignments.filter((foodAssignment) => {
        const member = membersById.get(foodAssignment.memberId);
        const ingredient = ingredientsById.get(foodAssignment.ingredientId);

        return (
          includesSearch(member?.fullName, search) ||
          includesSearch(ingredient?.name, search) ||
          includesSearch(foodAssignment.totalAmount, search) ||
          includesSearch(foodAssignment.currentAmount, search)
        );
      });
    },
    [foodAssignments, membersById, ingredientsById],
  );

  const searchFoodPickups = useCallback(
    (search: string) => {
      return foodPickups.filter((foodPickup) => {
        const member = membersById.get(foodPickup.memberId);
        const ingredient = ingredientsById.get(foodPickup.ingredientId);

        return (
          includesSearch(foodPickup.day, search) ||
          includesSearch(foodPickup.mealType, search) ||
          includesSearch(member?.fullName, search) ||
          includesSearch(ingredient?.name, search) ||
          includesSearch(foodPickup.amount, search) ||
          includesSearch(foodPickup.notes, search)
        );
      });
    },
    [foodPickups, membersById, ingredientsById],
  );

  const getFoodAssignmentDetails = useCallback(
    (id: string) => {
      const foodAssignment = foodAssignmentsById.get(id);

      if (!foodAssignment) {
        return undefined;
      }

      return {
        ...foodAssignment,
        member: membersById.get(foodAssignment.memberId),
        ingredient: ingredientsById.get(foodAssignment.ingredientId),
      };
    },
    [foodAssignmentsById, membersById, ingredientsById],
  );

  const getFoodPickupDetailsByDay = useCallback(
    (day: number) => {
      return getFoodPickupsByDay(day).map((foodPickup) => {
        return {
          ...foodPickup,
          member: membersById.get(foodPickup.memberId),
          ingredient: ingredientsById.get(foodPickup.ingredientId),
        };
      });
    },
    [getFoodPickupsByDay, membersById, ingredientsById],
  );

  const getRemainingAmountByIngredientId = useCallback(
    (ingredientId: string) => {
      return foodAssignments
        .filter((assignment) => assignment.ingredientId === ingredientId)
        .reduce((total, assignment) => total + assignment.currentAmount, 0);
    },
    [foodAssignments],
  );

  return {
    dutySchedules,
    foodAssignments,
    foodPickups,
    sortedDutySchedules,
    dutySchedulesById,
    dutySchedulesByDay,
    foodAssignmentsById,
    foodAssignmentsByMemberId,
    foodPickupsById,
    foodPickupsByDay,
    dutySchedulesCount: dutySchedules.length,
    foodAssignmentsCount: foodAssignments.length,
    foodPickupsCount: foodPickups.length,
    hasDutySchedules: dutySchedules.length > 0,
    hasFoodAssignments: foodAssignments.length > 0,
    hasFoodPickups: foodPickups.length > 0,
    addDutySchedule: store.addDutySchedule,
    removeDutySchedule: store.removeDutySchedule,
    updateDutySchedule: store.updateDutySchedule,
    setDutySchedules: store.setDutySchedules,
    clearDutySchedules: store.clearDutySchedules,
    addFoodAssignment: store.addFoodAssignment,
    removeFoodAssignment: store.removeFoodAssignment,
    updateFoodAssignment: store.updateFoodAssignment,
    setFoodAssignments: store.setFoodAssignments,
    clearFoodAssignments: store.clearFoodAssignments,
    addFoodPickup: store.addFoodPickup,
    removeFoodPickup: store.removeFoodPickup,
    updateFoodPickup: store.updateFoodPickup,
    setFoodPickups: store.setFoodPickups,
    clearFoodPickups: store.clearFoodPickups,
    getDutyScheduleById,
    getDutySchedulesByDay,
    getDutyMembersByDay,
    getFoodAssignmentById,
    getFoodAssignmentsByMemberId,
    getFoodAssignmentsByIngredientId,
    getFoodPickupById,
    getFoodPickupsByDay,
    getFoodAssignmentDetails,
    getFoodPickupDetailsByDay,
    getRemainingAmountByIngredientId,
    searchDutySchedules,
    searchFoodAssignments,
    searchFoodPickups,
  };
};

export const useDutyScheduleItem = (id: string) => {
  return useDutyScheduleStore(
    useCallback(
      (store) => store.dutySchedules.find((dutySchedule) => dutySchedule.id === id),
      [id],
    ),
  );
};

export const useFoodAssignment = (id: string) => {
  return useDutyScheduleStore(
    useCallback(
      (store) => store.foodAssignments.find((foodAssignment) => foodAssignment.id === id),
      [id],
    ),
  );
};

export const useFoodPickup = (id: string) => {
  return useDutyScheduleStore(
    useCallback(
      (store) => store.foodPickups.find((foodPickup) => foodPickup.id === id),
      [id],
    ),
  );
};
