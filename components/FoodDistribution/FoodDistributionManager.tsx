"use client";

import { useMemo, useState } from "react";
import InfoTooltip from "@/components/InfoTooltip/InfoTooltip";
import JsonStringImport from "@/components/JsonStringImport/JsonStringImport";
import { useDutySchedule, useMeals, useMembers } from "@/hooks";
import { Gender } from "@/types/members";
import { parseImportedFoodAssignment } from "@/utils/jsonImportParsers";
import css from "./FoodDistributionManager.module.css";
import { maxAverageGenderWeightDifference } from "@/helpers/constants";

type MemberSortMode = "gender" | "weightDesc" | "weightAsc" | "name";

const genderLabels: Record<Gender, string> = {
  male: "Хлопці",
  female: "Дівчата",
};

const memberSortLabels: Record<MemberSortMode, string> = {
  gender: "Стать",
  weightDesc: "Вага ↓",
  weightAsc: "Вага ↑",
  name: "Імʼя",
};

const formatNumber = (value: number) => {
  const roundedValue = Math.round(value * 100) / 100;

  return Number.isInteger(roundedValue)
    ? String(roundedValue)
    : String(roundedValue).replace(".", ",");
};

const normalizeAmount = (value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.round(value * 100) / 100;
};

const FoodDistributionManager = () => {
  const { sortedMembers } = useMembers();
  const { getRequiredIngredients, ingredientsById, sortedIngredients } =
    useMeals();
  const {
    addFoodAssignment,
    foodAssignments,
    removeFoodAssignment,
    setFoodAssignments,
    updateFoodAssignment,
  } = useDutySchedule();
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(0);
  const [memberSortMode, setMemberSortMode] =
    useState<MemberSortMode>("gender");
  const [expandedIngredientIds, setExpandedIngredientIds] = useState<
    Set<string>
  >(() => new Set());

  const requiredIngredients = useMemo(() => {
    return getRequiredIngredients();
  }, [getRequiredIngredients]);

  const teamOptions = useMemo(() => {
    return [...new Set(sortedMembers.map((member) => member.teamNumber))].sort(
      (firstTeam, secondTeam) => firstTeam - secondTeam,
    );
  }, [sortedMembers]);

  const activeTeam = teamOptions.includes(selectedTeam)
    ? selectedTeam
    : (teamOptions[0] ?? 0);

  const visibleMembers = useMemo(() => {
    return sortedMembers.filter((member) => member.teamNumber === activeTeam);
  }, [activeTeam, sortedMembers]);

  const visibleMemberIds = useMemo(() => {
    return new Set(visibleMembers.map((member) => member.id));
  }, [visibleMembers]);

  const visibleIngredients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return sortedIngredients;
    }

    return sortedIngredients.filter((ingredient) => {
      return `${ingredient.name} ${ingredient.unit}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [search, sortedIngredients]);

  const assignmentsByCell = useMemo(() => {
    return new Map(
      foodAssignments.map((assignment) => [
        `${assignment.ingredientId}:${assignment.memberId}`,
        assignment,
      ]),
    );
  }, [foodAssignments]);

  const getAssignedAmount = (ingredientId: string, memberId: string) => {
    return (
      assignmentsByCell.get(`${ingredientId}:${memberId}`)?.totalAmount ?? 0
    );
  };

  const getIngredientAssignedAmount = (ingredientId: string) => {
    return foodAssignments
      .filter((assignment) => {
        return (
          assignment.ingredientId === ingredientId &&
          visibleMemberIds.has(assignment.memberId)
        );
      })
      .reduce((total, assignment) => total + assignment.totalAmount, 0);
  };

  const memberLoads = useMemo(() => {
    return visibleMembers.map((member) => {
      const weight = foodAssignments.reduce((total, assignment) => {
        if (assignment.memberId !== member.id) {
          return total;
        }

        const ingredient = ingredientsById.get(assignment.ingredientId);

        return total + assignment.totalAmount * (ingredient?.weight ?? 0);
      }, 0);

      return {
        member,
        weight,
      };
    });
  }, [foodAssignments, ingredientsById, visibleMembers]);

  const sortedMemberLoads = useMemo(() => {
    return [...memberLoads].sort((firstLoad, secondLoad) => {
      if (memberSortMode === "gender") {
        if (firstLoad.member.gender !== secondLoad.member.gender) {
          return firstLoad.member.gender === "male" ? -1 : 1;
        }

        return firstLoad.member.fullName.localeCompare(
          secondLoad.member.fullName,
          "uk",
        );
      }

      if (memberSortMode === "weightDesc") {
        if (firstLoad.weight !== secondLoad.weight) {
          return secondLoad.weight - firstLoad.weight;
        }

        return firstLoad.member.fullName.localeCompare(
          secondLoad.member.fullName,
          "uk",
        );
      }

      if (memberSortMode === "weightAsc") {
        if (firstLoad.weight !== secondLoad.weight) {
          return firstLoad.weight - secondLoad.weight;
        }

        return firstLoad.member.fullName.localeCompare(
          secondLoad.member.fullName,
          "uk",
        );
      }

      return firstLoad.member.fullName.localeCompare(
        secondLoad.member.fullName,
        "uk",
      );
    });
  }, [memberLoads, memberSortMode]);

  const sortedVisibleMembers = useMemo(() => {
    return sortedMemberLoads.map((load) => load.member);
  }, [sortedMemberLoads]);

  const loadStats = useMemo(() => {
    const getAverage = (gender?: Gender) => {
      const loads = gender
        ? memberLoads.filter((load) => load.member.gender === gender)
        : memberLoads;

      if (loads.length === 0) {
        return 0;
      }

      return (
        loads.reduce((total, load) => total + load.weight, 0) / loads.length
      );
    };

    return {
      heaviest: [...memberLoads].sort(
        (firstLoad, secondLoad) => secondLoad.weight - firstLoad.weight,
      )[0],
      lightest: [...memberLoads].sort(
        (firstLoad, secondLoad) => firstLoad.weight - secondLoad.weight,
      )[0],
      averageAll: getAverage(),
      averageFemale: getAverage("female"),
      averageMale: getAverage("male"),
    };
  }, [memberLoads]);

  const totalRequiredWeight = sortedIngredients.reduce((total, ingredient) => {
    const requiredAmount = requiredIngredients[ingredient.id]?.amount ?? 0;
    return total + requiredAmount * ingredient.weight;
  }, 0);

  const totalAssignedWeight = memberLoads.reduce((total, load) => {
    return total + load.weight;
  }, 0);

  const handleAmountChange = (
    ingredientId: string,
    memberId: string,
    value: number,
  ) => {
    const amount = normalizeAmount(value);
    const assignment = assignmentsByCell.get(`${ingredientId}:${memberId}`);

    if (amount === 0) {
      if (assignment) {
        removeFoodAssignment(assignment.id);
      }

      return;
    }

    if (assignment) {
      updateFoodAssignment(assignment.id, {
        totalAmount: amount,
        currentAmount: amount,
      });
      return;
    }

    addFoodAssignment({
      id: "",
      ingredientId,
      memberId,
      totalAmount: amount,
      currentAmount: amount,
    });
  };

  const distributeEvenly = (ingredientId: string, amount: number) => {
    if (visibleMembers.length === 0 || amount <= 0) {
      return;
    }

    const ingredient = ingredientsById.get(ingredientId);
    const ingredientWeight = ingredient?.weight ?? 0;
    const plannedAmounts = new Map<string, number>();
    const memberWeights = new Map(
      memberLoads.map((load) => {
        const currentIngredientAmount = getAssignedAmount(
          ingredientId,
          load.member.id,
        );

        return [
          load.member.id,
          load.weight - currentIngredientAmount * ingredientWeight,
        ];
      }),
    );

    let remainingAmount = normalizeAmount(amount);

    while (remainingAmount > 0) {
      const nextMember = [...visibleMembers].sort(
        (firstMember, secondMember) => {
          const firstWeight = memberWeights.get(firstMember.id) ?? 0;
          const secondWeight = memberWeights.get(secondMember.id) ?? 0;

          if (firstWeight !== secondWeight) {
            return firstWeight - secondWeight;
          }

          if (firstMember.gender !== secondMember.gender) {
            return firstMember.gender === "male" ? -1 : 1;
          }

          return firstMember.fullName.localeCompare(
            secondMember.fullName,
            "uk",
          );
        },
      )[0];

      if (!nextMember) {
        return;
      }

      const nextAmount = remainingAmount >= 1 ? 1 : remainingAmount;
      plannedAmounts.set(
        nextMember.id,
        normalizeAmount((plannedAmounts.get(nextMember.id) ?? 0) + nextAmount),
      );
      memberWeights.set(
        nextMember.id,
        (memberWeights.get(nextMember.id) ?? 0) + nextAmount * ingredientWeight,
      );
      remainingAmount = normalizeAmount(remainingAmount - nextAmount);
    }

    setFoodAssignments([
      ...foodAssignments.filter((assignment) => {
        return !(
          assignment.ingredientId === ingredientId &&
          visibleMemberIds.has(assignment.memberId)
        );
      }),
      ...Array.from(plannedAmounts.entries()).map(
        ([memberId, plannedAmount]) => {
          return {
            id: crypto.randomUUID(),
            ingredientId,
            memberId,
            totalAmount: plannedAmount,
            currentAmount: plannedAmount,
          };
        },
      ),
    ]);
  };

  const distributeAllRemaining = () => {
    if (visibleMembers.length === 0) {
      return;
    }

    const nextAssignments = [...foodAssignments];
    const memberWeights = new Map(
      memberLoads.map((load) => [load.member.id, load.weight]),
    );

    const getAverageWeight = (gender: Gender) => {
      const genderMembers = visibleMembers.filter((member) => {
        return member.gender === gender;
      });

      if (genderMembers.length === 0) {
        return 0;
      }

      return (
        genderMembers.reduce((total, member) => {
          return total + (memberWeights.get(member.id) ?? 0);
        }, 0) / genderMembers.length
      );
    };

    const getLeastLoadedMember = (gender: Gender) => {
      return visibleMembers
        .filter((member) => member.gender === gender)
        .sort((firstMember, secondMember) => {
          const firstWeight = memberWeights.get(firstMember.id) ?? 0;
          const secondWeight = memberWeights.get(secondMember.id) ?? 0;

          if (firstWeight !== secondWeight) {
            return firstWeight - secondWeight;
          }

          return firstMember.fullName.localeCompare(
            secondMember.fullName,
            "uk",
          );
        })[0];
    };

    const getNextMember = () => {
      const leastLoadedMale = getLeastLoadedMember("male");
      const leastLoadedFemale = getLeastLoadedMember("female");
      const maleAverage = getAverageWeight("male");
      const femaleAverage = getAverageWeight("female");

      if (
        leastLoadedFemale &&
        leastLoadedMale &&
        maleAverage - femaleAverage > maxAverageGenderWeightDifference
      ) {
        return leastLoadedFemale;
      }

      return leastLoadedMale ?? leastLoadedFemale;
    };

    const getAssignedAmountFromNextState = (ingredientId: string) => {
      return nextAssignments
        .filter((assignment) => {
          return (
            assignment.ingredientId === ingredientId &&
            visibleMemberIds.has(assignment.memberId)
          );
        })
        .reduce((total, assignment) => total + assignment.totalAmount, 0);
    };

    const addAmountToMember = (
      ingredientId: string,
      memberId: string,
      amount: number,
    ) => {
      const assignmentIndex = nextAssignments.findIndex((assignment) => {
        return (
          assignment.ingredientId === ingredientId &&
          assignment.memberId === memberId
        );
      });

      if (assignmentIndex >= 0) {
        const assignment = nextAssignments[assignmentIndex];
        const nextAmount = normalizeAmount(assignment.totalAmount + amount);

        nextAssignments[assignmentIndex] = {
          ...assignment,
          totalAmount: nextAmount,
          currentAmount: nextAmount,
        };
        return;
      }

      nextAssignments.push({
        id: crypto.randomUUID(),
        ingredientId,
        memberId,
        totalAmount: amount,
        currentAmount: amount,
      });
    };

    sortedIngredients.forEach((ingredient) => {
      const requiredAmount = requiredIngredients[ingredient.id]?.amount ?? 0;
      let remainingAmount = normalizeAmount(
        requiredAmount - getAssignedAmountFromNextState(ingredient.id),
      );

      while (remainingAmount > 0) {
        const nextMember = getNextMember();

        if (!nextMember) {
          return;
        }

        const nextAmount = remainingAmount >= 1 ? 1 : remainingAmount;

        addAmountToMember(ingredient.id, nextMember.id, nextAmount);
        memberWeights.set(
          nextMember.id,
          (memberWeights.get(nextMember.id) ?? 0) +
            nextAmount * ingredient.weight,
        );
        remainingAmount = normalizeAmount(remainingAmount - nextAmount);
      }
    });

    setFoodAssignments(nextAssignments);
  };

  const clearIngredientAssignments = (ingredientId: string) => {
    foodAssignments
      .filter((assignment) => {
        return (
          assignment.ingredientId === ingredientId &&
          visibleMemberIds.has(assignment.memberId)
        );
      })
      .forEach((assignment) => removeFoodAssignment(assignment.id));
  };

  const clearTeamAssignments = () => {
    setFoodAssignments(
      foodAssignments.filter((assignment) => {
        return !visibleMemberIds.has(assignment.memberId);
      }),
    );
  };

  const toggleIngredient = (ingredientId: string) => {
    setExpandedIngredientIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(ingredientId)) {
        nextIds.delete(ingredientId);
      } else {
        nextIds.add(ingredientId);
      }

      return nextIds;
    });
  };

  const hasUnassignedIngredients = sortedIngredients.some((ingredient) => {
    const requiredAmount = requiredIngredients[ingredient.id]?.amount ?? 0;
    const assignedAmount = getIngredientAssignedAmount(ingredient.id);

    return normalizeAmount(requiredAmount - assignedAmount) > 0;
  });

  return (
    <main className={css["page"]}>
      <section className={css["header"]}>
        <div>
          <p className={css["eyebrow"]}>Розподіл продуктів</p>
          <h1 className={css["title"]}>Хто що несе</h1>
        </div>

        <div className={css["summary"]}>
          <div>
            <span>{sortedIngredients.length}</span>
            <small>продуктів</small>
          </div>
          <div>
            <span>{formatNumber(totalRequiredWeight)}</span>
            <small>кг потрібно</small>
          </div>
          <div>
            <span>{formatNumber(totalAssignedWeight)}</span>
            <small>кг розподілено</small>
          </div>
        </div>
      </section>

      <section className={css["section"]}>
        <div className={css["toolbar"]}>
          <label className={css["searchField"]}>
            <span>Пошук продукту</span>
            <input
              type="search"
              value={search}
              placeholder="Наприклад, рис або тушенка"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className={css["teamSwitcher"]}>
            <span>Бригада</span>
            <div className={css["teamButtons"]}>
              {teamOptions.map((teamNumber) => {
                const isActive = activeTeam === teamNumber;

                return (
                  <button
                    className={isActive ? css["activeTeamButton"] : ""}
                    key={teamNumber}
                    type="button"
                    onClick={() => setSelectedTeam(teamNumber)}
                  >
                    {teamNumber}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {sortedIngredients.length === 0 ? (
          <div className={css["emptyState"]}>
            Спочатку додайте продукти на сторінці “Продукти”.
          </div>
        ) : visibleMembers.length === 0 ? (
          <div className={css["emptyState"]}>
            Додайте учасників або оберіть іншу бригаду.
          </div>
        ) : (
          <>
            <section className={css["balanceSection"]}>
              <div className={css["subsectionHeader"]}>
                <div>
                  <div className={css["headingWithTooltip"]}>
                    <h2>Баланс ваги</h2>
                    <InfoTooltip label="Показує поточну вагу продуктів по учасниках активної бригади, окремо середні значення для хлопців і дівчат." />
                  </div>
                </div>

                <div className={css["sortControl"]}>
                  <span>Сортування</span>
                  <div className={css["sortButtons"]}>
                    {(Object.keys(memberSortLabels) as MemberSortMode[]).map(
                      (sortMode) => {
                        const isActive = memberSortMode === sortMode;

                        return (
                          <button
                            className={isActive ? css["activeSortButton"] : ""}
                            key={sortMode}
                            type="button"
                            onClick={() => setMemberSortMode(sortMode)}
                          >
                            {memberSortLabels[sortMode]}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>

              <div className={css["loadDashboard"]}>
                <article className={css["loadMetric"]}>
                  <span>Найбільше несе</span>
                  <strong>
                    {loadStats.heaviest
                      ? loadStats.heaviest.member.fullName
                      : "Немає даних"}
                  </strong>
                  <small>
                    {formatNumber(loadStats.heaviest?.weight ?? 0)} кг
                  </small>
                </article>

                <article className={css["loadMetric"]}>
                  <span>Найменше несе</span>
                  <strong>
                    {loadStats.lightest
                      ? loadStats.lightest.member.fullName
                      : "Немає даних"}
                  </strong>
                  <small>
                    {formatNumber(loadStats.lightest?.weight ?? 0)} кг
                  </small>
                </article>

                <article className={css["loadMetric"]}>
                  <span>Середня вага</span>
                  <strong>{formatNumber(loadStats.averageAll)} кг</strong>
                  <small>усі учасники</small>
                </article>

                <article className={css["loadMetric"]}>
                  <span>Середня вага хлопців</span>
                  <strong>{formatNumber(loadStats.averageMale)} кг</strong>
                  <small>{genderLabels.male}</small>
                </article>

                <article className={css["loadMetric"]}>
                  <span>Середня вага дівчат</span>
                  <strong>{formatNumber(loadStats.averageFemale)} кг</strong>
                  <small>{genderLabels.female}</small>
                </article>
              </div>

              <div className={css["memberLoads"]}>
                {sortedMemberLoads.map((load) => {
                  return (
                    <article
                      className={`${css["memberLoadCard"]} ${
                        load.member.gender === "female"
                          ? css["femaleMember"]
                          : css["maleMember"]
                      }`}
                      key={load.member.id}
                    >
                      <span>{load.member.fullName}</span>
                      <strong>{formatNumber(load.weight)} кг</strong>
                      <small>{genderLabels[load.member.gender]}</small>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className={css["productsSection"]}>
              <div className={css["subsectionHeader"]}>
                <div>
                  <div className={css["headingWithTooltip"]}>
                    <h2>Продукти для розподілу</h2>
                    <InfoTooltip
                      label={`Автоматичний розподіл додає нерозподілені продукти по одному, спершу менш навантаженим хлопцям, але тримає різницю середньої ваги хлопців і дівчат до ${maxAverageGenderWeightDifference} кг.`}
                    />
                  </div>
                </div>
                <div className={css["productsActions"]}>
                  <button
                    className={css["autoDistributionButton"]}
                    disabled={!hasUnassignedIngredients}
                    type="button"
                    onClick={distributeAllRemaining}
                  >
                    Автоматичний розподіл
                  </button>
                  <button
                    className={css["resetDistributionButton"]}
                    disabled={foodAssignments.every((assignment) => {
                      return !visibleMemberIds.has(assignment.memberId);
                    })}
                    type="button"
                    onClick={clearTeamAssignments}
                  >
                    Скинути
                  </button>
                </div>
              </div>

              <div className={css["ingredientList"]}>
                {visibleIngredients.map((ingredient) => {
                  const requiredAmount =
                    requiredIngredients[ingredient.id]?.amount ?? 0;
                  const assignedAmount = getIngredientAssignedAmount(
                    ingredient.id,
                  );
                  const remainingAmount = normalizeAmount(
                    requiredAmount - assignedAmount,
                  );
                  const progress =
                    requiredAmount > 0
                      ? Math.min(100, (assignedAmount / requiredAmount) * 100)
                      : 100;
                  const statusClass =
                    remainingAmount < 0
                      ? css["overAssigned"]
                      : remainingAmount > 0
                        ? css["underAssigned"]
                        : css["completeAssigned"];
                  const isExpanded = expandedIngredientIds.has(ingredient.id);

                  return (
                    <article
                      className={`${css["ingredientCard"]} ${statusClass}`}
                      key={ingredient.id}
                    >
                      <div className={css["ingredientHeader"]}>
                        <div>
                          <h2>{ingredient.name}</h2>
                          <span>{ingredient.unit}</span>
                        </div>

                        <div className={css["ingredientStats"]}>
                          <div>
                            <small>Потрібно</small>
                            <strong>{formatNumber(requiredAmount)}</strong>
                          </div>
                          <div>
                            <small>Взяли</small>
                            <strong>{formatNumber(assignedAmount)}</strong>
                          </div>
                          <div>
                            <small>Залишок</small>
                            <strong>{formatNumber(remainingAmount)}</strong>
                          </div>
                          <div>
                            <small>Вага</small>
                            <strong>
                              {formatNumber(requiredAmount * ingredient.weight)}{" "}
                              кг
                            </strong>
                          </div>
                        </div>

                        <button
                          className={css["toggleIngredientButton"]}
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => toggleIngredient(ingredient.id)}
                        >
                          {isExpanded ? "Згорнути" : "Розгорнути"}
                        </button>
                      </div>

                      <div className={css["progressTrack"]}>
                        <div
                          className={css["progressValue"]}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {isExpanded ? (
                        <div className={css["ingredientDetails"]}>
                          <div className={css["assignmentGrid"]}>
                            {sortedVisibleMembers.map((member) => {
                              const assignedToMember = getAssignedAmount(
                                ingredient.id,
                                member.id,
                              );
                              const memberLoad = memberLoads.find(
                                (load) => load.member.id === member.id,
                              );

                              return (
                                <label
                                  className={`${css["assignmentCell"]} ${
                                    member.gender === "female"
                                      ? css["femaleMember"]
                                      : css["maleMember"]
                                  }`}
                                  key={member.id}
                                >
                                  <span>{member.fullName}</span>
                                  <small>
                                    {formatNumber(memberLoad?.weight ?? 0)} кг
                                  </small>
                                  <input
                                    min={0}
                                    step={1}
                                    type="number"
                                    value={assignedToMember}
                                    onChange={(event) =>
                                      handleAmountChange(
                                        ingredient.id,
                                        member.id,
                                        Number(event.target.value),
                                      )
                                    }
                                  />
                                </label>
                              );
                            })}
                          </div>

                          <div className={css["rowActions"]}>
                            <button
                              type="button"
                              onClick={() =>
                                distributeEvenly(ingredient.id, requiredAmount)
                              }
                            >
                              Розподілити по вазі
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                clearIngredientAssignments(ingredient.id)
                              }
                            >
                              Очистити продукт
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </section>

      <JsonStringImport
        arrayKeys={["foodAssignments"]}
        description="Встав JSON-масив розподілу продуктів або обʼєкт з data.foodAssignments. Поточний розподіл продуктів буде замінено імпортованим масивом."
        example={`[
  {
    "memberId": "member-1",
    "ingredientId": "ingredient-1",
    "totalAmount": 2,
    "currentAmount": 2
  }
]`}
        parseItem={parseImportedFoodAssignment}
        title="Імпорт розподілу продуктів з JSON"
        onImport={setFoodAssignments}
      />
    </main>
  );
};

export default FoodDistributionManager;
