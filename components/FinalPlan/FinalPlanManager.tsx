"use client";

import { useMemo, useState } from "react";
import InfoTooltip from "@/components/InfoTooltip/InfoTooltip";
import { useDutySchedule, useMeals, useMembers, useSettings } from "@/hooks";
import { MealPlan, MealType } from "@/types/meals";
import css from "./FinalPlanManager.module.css";

type PickupRow = {
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

type ReadinessIssue = {
  id: string;
  title: string;
  details: string;
  severity: "error" | "warning";
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

const genderLabels = {
  male: "хлопці",
  female: "дівчата",
};

const maxAverageGenderWeightDifference = 1;
const maxMemberWeightDifference = 2;

const formatNumber = (value: number) => {
  const roundedValue = Math.round(value * 100) / 100;

  return Number.isInteger(roundedValue)
    ? String(roundedValue)
    : String(roundedValue).replace(".", ",");
};

const formatDate = (date: string) => {
  if (!date) {
    return "Не вказано";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
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

const includesSearch = (values: (number | string | undefined)[], search: string) => {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return values.some((value) => {
    return String(value ?? "").toLowerCase().includes(normalizedSearch);
  });
};

const getTripDays = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) {
    return [];
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = end.getTime() - start.getTime();

  if (Number.isNaN(diff) || diff < 0) {
    return [];
  }

  const daysCount = Math.floor(diff / 86_400_000) + 1;

  return Array.from({ length: daysCount }, (_, index) => index + 1);
};

const FinalPlanManager = () => {
  const [search, setSearch] = useState("");
  const { endDate, startDate, startPoint, endPoint } = useSettings();
  const { membersById, sortedMembers } = useMembers();
  const {
    foodAssignments,
    foodPickups,
    sortedDutySchedules,
  } = useDutySchedule();
  const {
    ingredientsById,
    mealIngredientsByMealId,
    mealPlans,
    mealsById,
    sortedMealPlans,
  } = useMeals();

  const teamGroups = useMemo(() => {
    return [...new Set(sortedMembers.map((member) => member.teamNumber))]
      .sort((firstTeam, secondTeam) => firstTeam - secondTeam)
      .map((teamNumber) => {
        return {
          teamNumber,
          members: sortedMembers.filter((member) => {
            return member.teamNumber === teamNumber;
          }),
        };
      });
  }, [sortedMembers]);

  const requiredIngredients = useMemo(() => {
    const rows = new Map<
      string,
      { id: string; name: string; unit: string; amount: number; weight: number }
    >();

    mealPlans.forEach((mealPlan) => {
      const recipeRows = mealIngredientsByMealId[mealPlan.mealId] ?? [];

      recipeRows.forEach((recipeRow) => {
        const ingredient = ingredientsById.get(recipeRow.ingredientId);

        if (!ingredient) {
          return;
        }

        const currentRow = rows.get(ingredient.id);

        rows.set(ingredient.id, {
          id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          amount: (currentRow?.amount ?? 0) + recipeRow.amount,
          weight: ingredient.weight,
        });
      });
    });

    return [...rows.values()].sort((firstRow, secondRow) => {
      return firstRow.name.localeCompare(secondRow.name, "uk");
    });
  }, [ingredientsById, mealIngredientsByMealId, mealPlans]);

  const foodDistributionRows = useMemo(() => {
    return sortedMembers
      .map((member) => {
        const assignments = foodAssignments.filter((assignment) => {
          return assignment.memberId === member.id;
        });
        const totalWeight = assignments.reduce((total, assignment) => {
          const ingredient = ingredientsById.get(assignment.ingredientId);

          return total + assignment.currentAmount * (ingredient?.weight ?? 0);
        }, 0);
        const products = assignments
          .filter((assignment) => assignment.currentAmount > 0)
          .map((assignment) => {
            const ingredient = ingredientsById.get(assignment.ingredientId);

            return `${ingredient?.name ?? "Продукт"} ${formatNumber(
              assignment.currentAmount,
            )} ${ingredient?.unit ?? ""}`;
          })
          .join(", ");

        return {
          member,
          products,
          totalWeight,
        };
      })
      .sort((firstRow, secondRow) => {
        if (firstRow.member.teamNumber !== secondRow.member.teamNumber) {
          return firstRow.member.teamNumber - secondRow.member.teamNumber;
        }

        if (firstRow.member.gender !== secondRow.member.gender) {
          return firstRow.member.gender === "male" ? -1 : 1;
        }

        return firstRow.member.fullName.localeCompare(
          secondRow.member.fullName,
          "uk",
        );
      });
  }, [foodAssignments, ingredientsById, sortedMembers]);

  const pickupCards = useMemo<PickupCard[]>(() => {
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
        const pickups = foodPickups.filter((pickup) => {
          return (
            pickup.day === mealPlan.day &&
            pickup.mealType === mealPlan.mealType &&
            pickup.ingredientId === recipeRow.ingredientId
          );
        });
        const suppliers =
          pickups
            .map((pickup) => {
              const memberName =
                membersById.get(pickup.memberId)?.fullName ??
                "Учасника не знайдено";

              return `${memberName} (${formatNumber(pickup.amount)})`;
            })
            .join(", ") || "Не розподілено";

        return {
          ingredientName: ingredient
            ? `${ingredient.name} ${ingredient.unit}`
            : "Інгредієнт не знайдено",
          amount: recipeRow.amount,
          suppliers,
        };
      });

      return {
        id: mealPlan.id,
        title: `${formatPlanDate(startDate, mealPlan.day)} ${
          mealTypeLabels[mealPlan.mealType]
        } - ${meal?.name ?? "Страву не знайдено"}`,
        dutyMembers,
        rows,
      };
    });
  }, [
    foodPickups,
    ingredientsById,
    mealIngredientsByMealId,
    mealPlans,
    mealsById,
    membersById,
    sortedDutySchedules,
    startDate,
  ]);

  const summary = {
    members: sortedMembers.length,
    teams: teamGroups.length,
    days: new Set(sortedMealPlans.map((mealPlan) => mealPlan.day)).size,
    products: requiredIngredients.length,
  };

  const readinessIssues = useMemo<ReadinessIssue[]>(() => {
    const issues: ReadinessIssue[] = [];
    const tripDays = getTripDays(startDate, endDate);
    const knownDays = [
      ...new Set([
        ...tripDays,
        ...mealPlans.map((mealPlan) => mealPlan.day),
        ...sortedDutySchedules.map((schedule) => schedule.day),
      ]),
    ].sort((firstDay, secondDay) => firstDay - secondDay);

    if (!startDate || !endDate) {
      issues.push({
        id: "date-range",
        severity: "error",
        title: "Не вказані дати походу",
        details: "Додайте дату початку і дату завершення на головній сторінці.",
      });
    }

    if (!startPoint || !endPoint) {
      issues.push({
        id: "route-points",
        severity: "warning",
        title: "Не повністю вказаний маршрут",
        details: "Додайте стартову і кінцеву точку маршруту на головній сторінці.",
      });
    }

    if (sortedMembers.length === 0) {
      issues.push({
        id: "members",
        severity: "error",
        title: "Немає учасників",
        details: "Додайте учасників і розподіліть їх по бригадах.",
      });
    }

    const invalidTeamMembers = sortedMembers.filter((member) => {
      return !Number.isFinite(member.teamNumber) || member.teamNumber < 1;
    });

    if (invalidTeamMembers.length > 0) {
      issues.push({
        id: "member-teams",
        severity: "error",
        title: "Є учасники без коректної бригади",
        details: invalidTeamMembers
          .map((member) => member.fullName)
          .slice(0, 6)
          .join(", "),
      });
    }

    const mealsWithoutRecipe = [...mealsById.values()].filter((meal) => {
      return (mealIngredientsByMealId[meal.id] ?? []).length === 0;
    });

    if (mealsWithoutRecipe.length > 0) {
      issues.push({
        id: "meals-without-recipe",
        severity: "warning",
        title: "Є страви без рецепту",
        details: mealsWithoutRecipe
          .map((meal) => meal.name)
          .slice(0, 8)
          .join(", "),
      });
    }

    const mealPlansWithoutRecipe = sortedMealPlans.filter((mealPlan) => {
      return (mealIngredientsByMealId[mealPlan.mealId] ?? []).length === 0;
    });

    if (mealPlansWithoutRecipe.length > 0) {
      issues.push({
        id: "meal-plans-without-recipe",
        severity: "error",
        title: "У раціоні є прийоми їжі без рецепту",
        details: mealPlansWithoutRecipe
          .map((mealPlan) => {
            return `${formatPlanDate(startDate, mealPlan.day)} ${
              mealPlan.mealType
            }`;
          })
          .slice(0, 8)
          .join(", "),
      });
    }

    const daysWithoutMealPlan = knownDays.filter((day) => {
      return !mealPlans.some((mealPlan) => mealPlan.day === day);
    });

    if (daysWithoutMealPlan.length > 0) {
      issues.push({
        id: "days-without-meal-plan",
        severity: "error",
        title: "Є дні без раціону",
        details: daysWithoutMealPlan
          .map((day) => `День ${day}`)
          .slice(0, 10)
          .join(", "),
      });
    }

    const daysWithoutDuty = knownDays.filter((day) => {
      return !sortedDutySchedules.some((schedule) => {
        return schedule.day === day && schedule.memberIds.length > 0;
      });
    });

    if (daysWithoutDuty.length > 0) {
      issues.push({
        id: "days-without-duty",
        severity: "error",
        title: "Є дні без чергових",
        details: daysWithoutDuty
          .map((day) => `День ${day}`)
          .slice(0, 10)
          .join(", "),
      });
    }

    const undistributedIngredients = requiredIngredients.filter((ingredient) => {
      const assignedAmount = foodAssignments
        .filter((assignment) => assignment.ingredientId === ingredient.id)
        .reduce((total, assignment) => total + assignment.currentAmount, 0);

      return assignedAmount + 0.001 < ingredient.amount;
    });

    if (undistributedIngredients.length > 0) {
      issues.push({
        id: "undistributed-food",
        severity: "error",
        title: "Не всі продукти розподілені між учасниками",
        details: undistributedIngredients
          .map((ingredient) => ingredient.name)
          .slice(0, 8)
          .join(", "),
      });
    }

    const incompletePickups = sortedMealPlans.flatMap((mealPlan) => {
      const recipeRows = mealIngredientsByMealId[mealPlan.mealId] ?? [];

      return recipeRows
        .filter((recipeRow) => {
          const pickedAmount = foodPickups
            .filter((pickup) => {
              return (
                pickup.day === mealPlan.day &&
                pickup.mealType === mealPlan.mealType &&
                pickup.ingredientId === recipeRow.ingredientId
              );
            })
            .reduce((total, pickup) => total + pickup.amount, 0);

          return pickedAmount + 0.001 < recipeRow.amount;
        })
        .map((recipeRow) => {
          const ingredient = ingredientsById.get(recipeRow.ingredientId);

          return `${formatPlanDate(startDate, mealPlan.day)} ${
            mealPlan.mealType
          }: ${ingredient?.name ?? "продукт"}`;
        });
    });

    if (incompletePickups.length > 0) {
      issues.push({
        id: "incomplete-pickups",
        severity: "error",
        title: "Забір продуктів заповнений не повністю",
        details: incompletePickups.slice(0, 8).join(", "),
      });
    }

    const memberWeights = sortedMembers.map((member) => {
      const weight = foodAssignments
        .filter((assignment) => assignment.memberId === member.id)
        .reduce((total, assignment) => {
          const ingredient = ingredientsById.get(assignment.ingredientId);

          return total + assignment.currentAmount * (ingredient?.weight ?? 0);
        }, 0);

      return { member, weight };
    });
    const loadedMembers = memberWeights.filter((row) => row.weight > 0);

    if (loadedMembers.length > 1) {
      const minWeight = Math.min(...loadedMembers.map((row) => row.weight));
      const maxWeight = Math.max(...loadedMembers.map((row) => row.weight));

      if (maxWeight - minWeight > maxMemberWeightDifference) {
        issues.push({
          id: "member-weight-balance",
          severity: "warning",
          title: "Є велика різниця ваги між учасниками",
          details: `Мінімум ${formatNumber(minWeight)} кг, максимум ${formatNumber(
            maxWeight,
          )} кг.`,
        });
      }
    }

    const getAverageWeight = (gender: "male" | "female") => {
      const rows = memberWeights.filter((row) => row.member.gender === gender);

      if (rows.length === 0) {
        return 0;
      }

      return rows.reduce((total, row) => total + row.weight, 0) / rows.length;
    };
    const maleAverageWeight = getAverageWeight("male");
    const femaleAverageWeight = getAverageWeight("female");

    if (
      maleAverageWeight > 0 &&
      femaleAverageWeight > 0 &&
      Math.abs(maleAverageWeight - femaleAverageWeight) >
        maxAverageGenderWeightDifference
    ) {
      issues.push({
        id: "gender-weight-balance",
        severity: "warning",
        title: "Середня вага хлопців і дівчат сильно відрізняється",
        details: `Хлопці ${formatNumber(
          maleAverageWeight,
        )} кг, дівчата ${formatNumber(femaleAverageWeight)} кг.`,
      });
    }

    return issues;
  }, [
    endDate,
    foodAssignments,
    foodPickups,
    ingredientsById,
    mealIngredientsByMealId,
    mealPlans,
    mealsById,
    requiredIngredients,
    sortedDutySchedules,
    sortedMealPlans,
    sortedMembers,
    startDate,
    endPoint,
    startPoint,
  ]);

  const readinessErrorsCount = readinessIssues.filter((issue) => {
    return issue.severity === "error";
  }).length;
  const readinessWarningsCount = readinessIssues.filter((issue) => {
    return issue.severity === "warning";
  }).length;

  const filteredTeamGroups = useMemo(() => {
    return teamGroups
      .map((team) => {
        return {
          ...team,
          members: team.members.filter((member) => {
            return includesSearch(
              [member.fullName, genderLabels[member.gender], member.teamNumber],
              search,
            );
          }),
        };
      })
      .filter((team) => team.members.length > 0);
  }, [search, teamGroups]);

  const filteredMealPlans = useMemo(() => {
    return sortedMealPlans.filter((mealPlan) => {
      const meal = mealsById.get(mealPlan.mealId);
      const dutyMembers =
        sortedDutySchedules
          .find((schedule) => schedule.day === mealPlan.day)
          ?.memberIds.map((memberId) => membersById.get(memberId)?.fullName)
          .filter(Boolean)
          .join(" ") ?? "";

      return includesSearch(
        [
          mealPlan.day,
          formatPlanDate(startDate, mealPlan.day),
          mealPlan.mealType,
          meal?.name,
          dutyMembers,
        ],
        search,
      );
    });
  }, [mealsById, membersById, search, sortedDutySchedules, sortedMealPlans, startDate]);

  const filteredRequiredIngredients = useMemo(() => {
    return requiredIngredients.filter((ingredient) => {
      return includesSearch(
        [
          ingredient.name,
          ingredient.unit,
          ingredient.amount,
          ingredient.weight,
          ingredient.amount * ingredient.weight,
        ],
        search,
      );
    });
  }, [requiredIngredients, search]);

  const filteredFoodDistributionRows = useMemo(() => {
    return foodDistributionRows.filter((row) => {
      return includesSearch(
        [
          row.member.fullName,
          row.member.teamNumber,
          genderLabels[row.member.gender],
          row.totalWeight,
          row.products,
        ],
        search,
      );
    });
  }, [foodDistributionRows, search]);

  const filteredPickupCards = useMemo(() => {
    return pickupCards
      .map((card) => {
        const rows = card.rows.filter((row) => {
          return includesSearch(
            [card.title, card.dutyMembers, row.ingredientName, row.amount, row.suppliers],
            search,
          );
        });

        return {
          ...card,
          rows,
        };
      })
      .filter((card) => {
        return (
          card.rows.length > 0 ||
          includesSearch([card.title, card.dutyMembers], search)
        );
      });
  }, [pickupCards, search]);

  return (
    <main className={css["page"]}>
      <section className={css["header"]}>
        <div>
          <p className={css["eyebrow"]}>Фінальний план</p>
          <h1 className={css["title"]}>План походу в одному місці</h1>
        </div>
      </section>

      <section className={css["summaryGrid"]}>
        <div className={css["summaryCard"]}>
          <span>Дати</span>
          <strong>
            {formatDate(startDate)} - {formatDate(endDate)}
          </strong>
        </div>
        <div className={css["summaryCard"]}>
          <span>Маршрут</span>
          <strong>
            {startPoint || "Старт не вказано"} - {endPoint || "Фініш не вказано"}
          </strong>
        </div>
        <div className={css["summaryCard"]}>
          <span>Учасники</span>
          <strong>{summary.members}</strong>
        </div>
        <div className={css["summaryCard"]}>
          <span>Бригади</span>
          <strong>{summary.teams}</strong>
        </div>
        <div className={css["summaryCard"]}>
          <span>Дні з раціоном</span>
          <strong>{summary.days}</strong>
        </div>
        <div className={css["summaryCard"]}>
          <span>Продукти</span>
          <strong>{summary.products}</strong>
        </div>
      </section>

      <section className={css["readinessSection"]}>
        <div className={css["readinessHeader"]}>
          <div>
            <div className={css["headingWithTooltip"]}>
              <h2>Перевірка готовності походу</h2>
              <InfoTooltip label="Перевіряє дати, маршрут, раціон, рецепти, чергування, розподіл продуктів, забір продуктів і баланс ваги." />
            </div>
          </div>

          <div className={css["readinessStats"]}>
            <div
              className={`${css["readinessStat"]} ${
                readinessErrorsCount > 0 ? css["errorStat"] : ""
              }`}
            >
              <span>Проблеми</span>
              <strong>{readinessErrorsCount}</strong>
            </div>
            <div
              className={`${css["readinessStat"]} ${
                readinessWarningsCount > 0 ? css["warningStat"] : ""
              }`}
            >
              <span>Попередження</span>
              <strong>{readinessWarningsCount}</strong>
            </div>
          </div>
        </div>

        {readinessIssues.length > 0 ? (
          <div className={css["readinessList"]}>
            {readinessIssues.map((issue) => {
              return (
                <article
                  className={`${css["readinessIssue"]} ${
                    issue.severity === "error"
                      ? css["readinessError"]
                      : css["readinessWarning"]
                  }`}
                  key={issue.id}
                >
                  <span>
                    {issue.severity === "error" ? "Потрібно виправити" : "Варто перевірити"}
                  </span>
                  <h3>{issue.title}</h3>
                  <p>{issue.details}</p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={css["readyState"]}>
            План виглядає готовим: основні дані заповнені, продукти
            розподілені, забір продуктів і чергування сформовані.
          </div>
        )}
      </section>

      <section className={css["searchSection"]}>
        <label className={css["searchField"]}>
          <span>Пошук у фінальному плані</span>
          <input
            type="search"
            value={search}
            placeholder="Учасник, продукт, страва, день або бригада"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </section>

      <details className={css["section"]}>
        <summary className={css["sectionSummary"]}>
          <h2>Учасники по бригадах</h2>
          <span>{filteredTeamGroups.length}</span>
        </summary>

        {filteredTeamGroups.length > 0 ? (
          <div className={css["teamGrid"]}>
            {filteredTeamGroups.map((team) => {
              return (
                <article className={css["teamCard"]} key={team.teamNumber}>
                  <h3>Бригада {team.teamNumber}</h3>
                  <ul>
                    {team.members.map((member) => {
                      return (
                        <li key={member.id}>
                          <span>{member.fullName}</span>
                          <small>{genderLabels[member.gender]}</small>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={css["emptyState"]}>
            {search.trim()
              ? "За пошуком не знайдено учасників."
              : "Учасників ще не додано."}
          </div>
        )}
      </details>

      <details className={css["section"]}>
        <summary className={css["sectionSummary"]}>
          <h2>Раціон і чергування</h2>
          <span>{filteredMealPlans.length}</span>
        </summary>

        {filteredMealPlans.length > 0 ? (
          <div className={css["tableWrap"]}>
            <table className={css["table"]}>
              <thead>
                <tr>
                  <th>День</th>
                  <th>Дата</th>
                  <th>Прийом</th>
                  <th>Страва</th>
                  <th>Чергові</th>
                </tr>
              </thead>
              <tbody>
                {filteredMealPlans.map((mealPlan) => {
                  const dutyMembers =
                    sortedDutySchedules
                      .find((schedule) => schedule.day === mealPlan.day)
                      ?.memberIds.map((memberId) => {
                        return membersById.get(memberId)?.fullName;
                      })
                      .filter(Boolean)
                      .join(", ") || "Не призначено";

                  return (
                    <tr key={mealPlan.id}>
                      <td>День {mealPlan.day}</td>
                      <td>{formatPlanDate(startDate, mealPlan.day)}</td>
                      <td>{mealPlan.mealType}</td>
                      <td>
                        {mealsById.get(mealPlan.mealId)?.name ??
                          "Страву не знайдено"}
                      </td>
                      <td>{dutyMembers}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={css["emptyState"]}>
            {search.trim()
              ? "За пошуком не знайдено прийомів їжі."
              : "Раціон ще не заповнено."}
          </div>
        )}
      </details>

      <details className={css["section"]}>
        <summary className={css["sectionSummary"]}>
          <h2>Потрібні продукти</h2>
          <span>{filteredRequiredIngredients.length}</span>
        </summary>

        {filteredRequiredIngredients.length > 0 ? (
          <div className={css["tableWrap"]}>
            <table className={css["table"]}>
              <thead>
                <tr>
                  <th>Продукт</th>
                  <th>Кількість</th>
                  <th>Вага одиниці</th>
                  <th>Загальна вага</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequiredIngredients.map((ingredient) => {
                  return (
                    <tr key={ingredient.id}>
                      <td>{ingredient.name}</td>
                      <td>
                        {formatNumber(ingredient.amount)} {ingredient.unit}
                      </td>
                      <td>{formatNumber(ingredient.weight)} кг</td>
                      <td>
                        {formatNumber(ingredient.amount * ingredient.weight)} кг
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={css["emptyState"]}>
            {search.trim()
              ? "За пошуком не знайдено продуктів."
              : "Список продуктів ще порожній."}
          </div>
        )}
      </details>

      <details className={css["section"]}>
        <summary className={css["sectionSummary"]}>
          <h2>Хто що несе</h2>
          <span>{filteredFoodDistributionRows.length}</span>
        </summary>

        {filteredFoodDistributionRows.length > 0 ? (
          <div className={css["tableWrap"]}>
            <table className={css["table"]}>
              <thead>
                <tr>
                  <th>Учасник</th>
                  <th>Бригада</th>
                  <th>Стать</th>
                  <th>Вага</th>
                  <th>Продукти</th>
                </tr>
              </thead>
              <tbody>
                {filteredFoodDistributionRows.map((row) => {
                  return (
                    <tr key={row.member.id}>
                      <td>{row.member.fullName}</td>
                      <td>{row.member.teamNumber}</td>
                      <td>{genderLabels[row.member.gender]}</td>
                      <td>{formatNumber(row.totalWeight)} кг</td>
                      <td>{row.products || "Нічого не розподілено"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={css["emptyState"]}>
            {search.trim()
              ? "За пошуком не знайдено розподілу продуктів."
              : "Розподіл продуктів ще не заповнено."}
          </div>
        )}
      </details>

      <details className={css["section"]}>
        <summary className={css["sectionSummary"]}>
          <h2>Забір продуктів по прийомах їжі</h2>
          <span>{filteredPickupCards.length}</span>
        </summary>

        {filteredPickupCards.length > 0 ? (
          <div className={css["pickupGrid"]}>
            {filteredPickupCards.map((card) => {
              return (
                <article className={css["pickupCard"]} key={card.id}>
                  <div className={css["pickupDuty"]}>{card.dutyMembers}</div>
                  <h3>{card.title}</h3>
                  <table>
                    <tbody>
                      {card.rows.map((row) => {
                        return (
                          <tr key={`${card.id}-${row.ingredientName}`}>
                            <td>{row.ingredientName}</td>
                            <td>{formatNumber(row.amount)}</td>
                            <td>{row.suppliers}</td>
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
            {search.trim()
              ? "За пошуком не знайдено забору продуктів."
              : "Забір продуктів ще не сформовано."}
          </div>
        )}
      </details>
    </main>
  );
};

export default FinalPlanManager;
