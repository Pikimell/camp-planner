"use client";

import { useMemo } from "react";
import { useDutySchedule, useMeals, useMembers, useSettings } from "@/hooks";
import { MealPlan, MealType } from "@/types/meals";
import css from "./FoodPickupPlanManager.module.css";

type PickupRow = {
  id: string;
  ingredientName: string;
  amount: number;
  suppliers: string;
};

type PickupCard = {
  id: string;
  title: string;
  dutyMembers: string;
  rows: PickupRow[];
};

type SupplierAllocation = {
  memberName: string;
  amount: number;
};

const mealTypeOrder: Record<MealType, number> = {
  Сніданок: 1,
  Обід: 2,
  Вечеря: 3,
  Перекус: 4,
};

const mealTypeLabels: Record<MealType, string> = {
  Сніданок: "ранок",
  Обід: "обід",
  Вечеря: "вечір",
  Перекус: "перекус",
};

const formatNumber = (value: number) => {
  const roundedValue = Math.round(value * 100) / 100;

  return Number.isInteger(roundedValue)
    ? String(roundedValue)
    : String(roundedValue).replace(".", ",");
};

const formatPlanDate = (startDate: string, day: number) => {
  if (!startDate) {
    return `День ${day}`;
  }

  const value = new Date(`${startDate}T00:00:00`);
  value.setDate(value.getDate() + day - 1);

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
  }).format(value);
};

const sortMealPlans = (mealPlans: MealPlan[]) => {
  return [...mealPlans].sort((firstPlan, secondPlan) => {
    if (firstPlan.day !== secondPlan.day) {
      return firstPlan.day - secondPlan.day;
    }

    return mealTypeOrder[firstPlan.mealType] - mealTypeOrder[secondPlan.mealType];
  });
};

const formatSupplierList = (
  allocations: SupplierAllocation[],
  requiredAmount: number,
  missingAmount: number,
) => {
  if (allocations.length === 0) {
    return missingAmount > 0
      ? `Не розподілено (${formatNumber(missingAmount)})`
      : "Не розподілено";
  }

  const shouldShowAmounts =
    allocations.length > 1 ||
    Math.abs(allocations[0].amount - requiredAmount) > 0.001;
  const supplierList = allocations
    .map((allocation) => {
      if (!shouldShowAmounts) {
        return allocation.memberName;
      }

      return `${allocation.memberName} (${formatNumber(allocation.amount)})`;
    })
    .join(", ");

  if (missingAmount > 0) {
    return `${supplierList}; не вистачає ${formatNumber(missingAmount)}`;
  }

  return supplierList;
};

const FoodPickupPlanManager = () => {
  const { membersById } = useMembers();
  const {
    foodAssignments,
    sortedDutySchedules,
  } = useDutySchedule();
  const {
    ingredientsById,
    mealIngredientsByMealId,
    mealPlans,
    mealsById,
  } = useMeals();
  const { startDate } = useSettings();

  const pickupCards = useMemo<PickupCard[]>(() => {
    const remainingByAssignmentId = new Map(
      foodAssignments.map((assignment) => [
        assignment.id,
        assignment.currentAmount || assignment.totalAmount,
      ]),
    );

    return sortMealPlans(mealPlans).map((mealPlan) => {
      const meal = mealsById.get(mealPlan.mealId);
      const recipeRows = mealIngredientsByMealId[mealPlan.mealId] ?? [];
      const dutyMembers =
        sortedDutySchedules
          .find((dutySchedule) => dutySchedule.day === mealPlan.day)
          ?.memberIds.map((memberId) => membersById.get(memberId)?.fullName)
          .filter(Boolean)
          .join(", ") || "Чергових не призначено";

      const rows = recipeRows.map((recipeRow) => {
        const ingredient = ingredientsById.get(recipeRow.ingredientId);
        const supplierAssignments = foodAssignments
          .filter((assignment) => {
            return assignment.ingredientId === recipeRow.ingredientId;
          })
          .sort((firstAssignment, secondAssignment) => {
            return secondAssignment.totalAmount - firstAssignment.totalAmount;
          });
        const allocations: SupplierAllocation[] = [];
        let amountToTake = recipeRow.amount;

        supplierAssignments.forEach((assignment) => {
          if (amountToTake <= 0) {
            return;
          }

          const availableAmount = remainingByAssignmentId.get(assignment.id) ?? 0;

          if (availableAmount <= 0) {
            return;
          }

          const takenAmount = Math.min(availableAmount, amountToTake);
          const memberName =
            membersById.get(assignment.memberId)?.fullName ?? "Учасника не знайдено";

          allocations.push({
            memberName,
            amount: takenAmount,
          });
          remainingByAssignmentId.set(
            assignment.id,
            Math.round((availableAmount - takenAmount) * 100) / 100,
          );
          amountToTake = Math.round((amountToTake - takenAmount) * 100) / 100;
        });

        return {
          id: recipeRow.id,
          ingredientName: ingredient
            ? `${ingredient.name} ${ingredient.unit}`
            : "Інгредієнт не знайдено",
          amount: recipeRow.amount,
          suppliers: formatSupplierList(allocations, recipeRow.amount, amountToTake),
        };
      });

      return {
        id: mealPlan.id,
        title: `${formatPlanDate(startDate, mealPlan.day)} ${
          mealTypeLabels[mealPlan.mealType]
        } - ${meal?.name.toUpperCase() ?? "СТРАВУ НЕ ЗНАЙДЕНО"}`,
        dutyMembers,
        rows,
      };
    });
  }, [
    foodAssignments,
    ingredientsById,
    mealIngredientsByMealId,
    mealPlans,
    mealsById,
    membersById,
    sortedDutySchedules,
    startDate,
  ]);

  return (
    <main className={css["page"]}>
      <section className={css["header"]}>
        <div>
          <p className={css["eyebrow"]}>Забір продуктів</p>
          <h1 className={css["title"]}>Готовий план для чергових</h1>
        </div>
        <div className={css["counter"]}>{pickupCards.length}</div>
      </section>

      <section className={css["section"]}>
        <div className={css["sectionHeader"]}>
          <h2>Готова розкладка за прийомами їжі</h2>
        </div>

        {pickupCards.length > 0 ? (
          <div className={css["cardsGrid"]}>
            {pickupCards.map((card) => {
              const blankRowsCount = Math.max(0, 9 - card.rows.length);

              return (
                <article className={css["pickupCard"]} key={card.id}>
                  <div className={css["dutyRow"]}>{card.dutyMembers}</div>
                  <div className={css["mealTitle"]}>{card.title}</div>

                  <table className={css["pickupTable"]}>
                    <tbody>
                      {card.rows.map((row) => {
                        return (
                          <tr key={row.id}>
                            <td>{row.ingredientName}</td>
                            <td>{formatNumber(row.amount)}</td>
                            <td>{row.suppliers}</td>
                          </tr>
                        );
                      })}

                      {Array.from({ length: blankRowsCount }).map((_, index) => {
                        return (
                          <tr key={`${card.id}-blank-${index}`}>
                            <td />
                            <td />
                            <td />
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={css["emptyState"]}>
            Додайте раціон, рецепти, чергування і розподіл продуктів, щоб
            побачити готовий план забору.
          </div>
        )}
      </section>
    </main>
  );
};

export default FoodPickupPlanManager;
