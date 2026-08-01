"use client";

import { useMemo, useState } from "react";
import InfoTooltip from "@/components/InfoTooltip/InfoTooltip";
import { useDutySchedule, useMeals, useMembers, useSettings } from "@/hooks";
import { MealIngredient, MealPlan, MealType } from "@/types/meals";
import { Gender } from "@/types/members";
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

type PickupDraft = {
  memberId: string;
  amount: number;
};

type PickupAutoMode = "balanced" | "unloadGirls" | "compact";
type WeightChartSeriesKey =
  | "maleAverage"
  | "femaleAverage"
  | "maleMax"
  | "femaleMax"
  | "maleMin"
  | "femaleMin";

type PickupWeightPoint = {
  label: string;
  maleAverage: number;
  femaleAverage: number;
  maleMax: number;
  femaleMax: number;
  maleMin: number;
  femaleMin: number;
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

const pickupAutoModeLabels: Record<PickupAutoMode, string> = {
  balanced: "Баланс",
  unloadGirls: "Розвантажити дівчат",
  compact: "Менше людей",
};

const maxAverageGenderWeightDifference = 1;
const chartWidth = 900;
const chartHeight = 280;
const chartPadding = 38;

const weightChartSeries: {
  key: WeightChartSeriesKey;
  label: string;
  lineClassName: string;
  pointClassName: string;
}[] = [
  {
    key: "maleAverage",
    label: "Хлопці середнє",
    lineClassName: "maleChartLine",
    pointClassName: "maleChartPoint",
  },
  {
    key: "femaleAverage",
    label: "Дівчата середнє",
    lineClassName: "femaleChartLine",
    pointClassName: "femaleChartPoint",
  },
  {
    key: "maleMax",
    label: "Хлопці максимум",
    lineClassName: "maleMaxChartLine",
    pointClassName: "maleMaxChartPoint",
  },
  {
    key: "femaleMax",
    label: "Дівчата максимум",
    lineClassName: "femaleMaxChartLine",
    pointClassName: "femaleMaxChartPoint",
  },
  {
    key: "maleMin",
    label: "Хлопці мінімум",
    lineClassName: "maleMinChartLine",
    pointClassName: "maleMinChartPoint",
  },
  {
    key: "femaleMin",
    label: "Дівчата мінімум",
    lineClassName: "femaleMinChartLine",
    pointClassName: "femaleMinChartPoint",
  },
];

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
  const { membersById, sortedMembers } = useMembers();
  const {
    addFoodPickup,
    foodAssignments,
    foodPickups,
    removeFoodPickup,
    setFoodPickups,
    sortedDutySchedules,
  } = useDutySchedule();
  const {
    ingredientsById,
    mealIngredientsByMealId,
    mealPlans,
    mealsById,
  } = useMeals();
  const { startDate } = useSettings();
  const [selectedTeam, setSelectedTeam] = useState(0);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMealType, setSelectedMealType] =
    useState<MealType>("Сніданок");
  const [pickupDrafts, setPickupDrafts] = useState<Record<string, PickupDraft>>(
    {},
  );
  const [expandedRecipeRowIds, setExpandedRecipeRowIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [pickupAutoMode, setPickupAutoMode] =
    useState<PickupAutoMode>("balanced");
  const [visibleWeightSeries, setVisibleWeightSeries] = useState<
    Record<WeightChartSeriesKey, boolean>
  >({
    maleAverage: true,
    femaleAverage: true,
    maleMax: true,
    femaleMax: true,
    maleMin: false,
    femaleMin: false,
  });

  const teamOptions = useMemo(() => {
    return [...new Set(sortedMembers.map((member) => member.teamNumber))].sort(
      (firstTeam, secondTeam) => firstTeam - secondTeam,
    );
  }, [sortedMembers]);

  const activeTeam = teamOptions.includes(selectedTeam)
    ? selectedTeam
    : (teamOptions[0] ?? 0);

  const activeTeamMemberIds = useMemo(() => {
    return new Set(
      sortedMembers
        .filter((member) => member.teamNumber === activeTeam)
        .map((member) => member.id),
    );
  }, [activeTeam, sortedMembers]);

  const activeTeamMembers = useMemo(() => {
    return sortedMembers.filter((member) => member.teamNumber === activeTeam);
  }, [activeTeam, sortedMembers]);

  const dayOptions = useMemo(() => {
    const days = [...new Set(mealPlans.map((mealPlan) => mealPlan.day))].sort(
      (firstDay, secondDay) => firstDay - secondDay,
    );

    return days.length > 0 ? days : [1];
  }, [mealPlans]);

  const activeDay = dayOptions.includes(selectedDay)
    ? selectedDay
    : dayOptions[0];

  const mealTypeOptions = useMemo(() => {
    const mealTypes = [
      ...new Set(
        mealPlans
          .filter((mealPlan) => mealPlan.day === activeDay)
          .map((mealPlan) => mealPlan.mealType),
      ),
    ].sort((firstType, secondType) => {
      return mealTypeOrder[firstType] - mealTypeOrder[secondType];
    });

    return mealTypes.length > 0 ? mealTypes : (["Сніданок"] as MealType[]);
  }, [activeDay, mealPlans]);

  const activeMealType = mealTypeOptions.includes(selectedMealType)
    ? selectedMealType
    : mealTypeOptions[0];

  const selectedMealPlan = useMemo(() => {
    return sortMealPlans(mealPlans).find((mealPlan) => {
      return mealPlan.day === activeDay && mealPlan.mealType === activeMealType;
    });
  }, [activeDay, activeMealType, mealPlans]);

  const selectedRecipeRows = useMemo(() => {
    if (!selectedMealPlan) {
      return [];
    }

    return mealIngredientsByMealId[selectedMealPlan.mealId] ?? [];
  }, [mealIngredientsByMealId, selectedMealPlan]);

  const sortedAllMealPlans = useMemo(() => {
    return sortMealPlans(mealPlans);
  }, [mealPlans]);

  const getTakenAmountForIngredient = (
    ingredientId: string,
    day = activeDay,
    mealType = activeMealType,
  ) => {
    return foodPickups
      .filter((pickup) => {
        return (
          pickup.day === day &&
          pickup.mealType === mealType &&
          pickup.ingredientId === ingredientId &&
          activeTeamMemberIds.has(pickup.memberId)
        );
      })
      .reduce((total, pickup) => total + pickup.amount, 0);
  };

  const getAvailableAmountForMember = (ingredientId: string, memberId: string) => {
    const assignedAmount = foodAssignments
      .filter((assignment) => {
        return (
          assignment.ingredientId === ingredientId &&
          assignment.memberId === memberId
        );
      })
      .reduce((total, assignment) => total + assignment.currentAmount, 0);
    const takenAmount = foodPickups
      .filter((pickup) => {
        return (
          pickup.ingredientId === ingredientId && pickup.memberId === memberId
        );
      })
      .reduce((total, pickup) => total + pickup.amount, 0);

    return Math.max(0, Math.round((assignedAmount - takenAmount) * 100) / 100);
  };

  const getEligibleMembersForIngredient = (ingredientId: string) => {
    return activeTeamMembers
      .map((member) => {
        return {
          member,
          availableAmount: getAvailableAmountForMember(ingredientId, member.id),
        };
      })
      .filter((row) => row.availableAmount > 0)
      .sort((firstRow, secondRow) => {
        return firstRow.member.fullName.localeCompare(
          secondRow.member.fullName,
          "uk",
        );
      });
  };

  const getDraft = (recipeRow: MealIngredient) => {
    const draft = pickupDrafts[recipeRow.id];
    const eligibleMembers = getEligibleMembersForIngredient(
      recipeRow.ingredientId,
    );
    const memberId = draft?.memberId || eligibleMembers[0]?.member.id || "";

    return {
      memberId,
      amount: draft?.amount ?? 1,
    };
  };

  const updateDraft = (recipeRowId: string, body: Partial<PickupDraft>) => {
    setPickupDrafts((currentDrafts) => {
      const currentDraft = currentDrafts[recipeRowId] ?? {
        memberId: "",
        amount: 1,
      };

      return {
        ...currentDrafts,
        [recipeRowId]: {
          ...currentDraft,
          ...body,
        },
      };
    });
  };

  const addPickupForRecipeRow = (recipeRow: MealIngredient) => {
    if (!selectedMealPlan) {
      return;
    }

    const draft = getDraft(recipeRow);
    const availableAmount = getAvailableAmountForMember(
      recipeRow.ingredientId,
      draft.memberId,
    );
    const alreadyTakenAmount = getTakenAmountForIngredient(
      recipeRow.ingredientId,
    );
    const neededAmount = Math.max(
      0,
      Math.round((recipeRow.amount - alreadyTakenAmount) * 100) / 100,
    );
    const amount = Math.min(draft.amount, availableAmount, neededAmount);

    if (!draft.memberId || amount <= 0) {
      return;
    }

    addFoodPickup({
      id: "",
      day: selectedMealPlan.day,
      mealType: selectedMealPlan.mealType,
      memberId: draft.memberId,
      ingredientId: recipeRow.ingredientId,
      amount,
      notes: "",
    });

    updateDraft(recipeRow.id, { amount: 1 });
  };

  const toggleRecipeRow = (recipeRowId: string) => {
    setExpandedRecipeRowIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(recipeRowId)) {
        nextIds.delete(recipeRowId);
      } else {
        nextIds.add(recipeRowId);
      }

      return nextIds;
    });
  };

  const createAutoDistributedPickups = (targetMealPlans: MealPlan[]) => {
    const nextPickups = [...foodPickups];
    const memberRemainingWeights = new Map(
      activeTeamMembers.map((member) => {
        const assignedWeight = foodAssignments
          .filter((assignment) => assignment.memberId === member.id)
          .reduce((total, assignment) => {
            const ingredient = ingredientsById.get(assignment.ingredientId);

            return total + assignment.currentAmount * (ingredient?.weight ?? 0);
          }, 0);
        const takenWeight = nextPickups
          .filter((pickup) => pickup.memberId === member.id)
          .reduce((total, pickup) => {
            const ingredient = ingredientsById.get(pickup.ingredientId);

            return total + pickup.amount * (ingredient?.weight ?? 0);
          }, 0);

        return [member.id, assignedWeight - takenWeight];
      }),
    );

    const getAverageRemainingWeight = (gender: "male" | "female") => {
      const members = activeTeamMembers.filter((member) => {
        return member.gender === gender;
      });

      if (members.length === 0) {
        return 0;
      }

      return (
        members.reduce((total, member) => {
          return total + (memberRemainingWeights.get(member.id) ?? 0);
        }, 0) / members.length
      );
    };

    const getAvailableAmount = (ingredientId: string, memberId: string) => {
      const assignedAmount = foodAssignments
        .filter((assignment) => {
          return (
            assignment.ingredientId === ingredientId &&
            assignment.memberId === memberId
          );
        })
        .reduce((total, assignment) => total + assignment.currentAmount, 0);
      const takenAmount = nextPickups
        .filter((pickup) => {
          return (
            pickup.ingredientId === ingredientId && pickup.memberId === memberId
          );
        })
        .reduce((total, pickup) => total + pickup.amount, 0);

      return Math.max(0, Math.round((assignedAmount - takenAmount) * 100) / 100);
    };

    const getTakenAmount = (mealPlan: MealPlan, ingredientId: string) => {
      return nextPickups
        .filter((pickup) => {
          return (
            pickup.day === mealPlan.day &&
            pickup.mealType === mealPlan.mealType &&
            pickup.ingredientId === ingredientId &&
            activeTeamMemberIds.has(pickup.memberId)
          );
        })
        .reduce((total, pickup) => total + pickup.amount, 0);
    };

    const getCandidate = (ingredientId: string) => {
      const candidates = activeTeamMembers
        .map((member) => {
          return {
            member,
            availableAmount: getAvailableAmount(ingredientId, member.id),
            remainingWeight: memberRemainingWeights.get(member.id) ?? 0,
          };
        })
        .filter((candidate) => candidate.availableAmount > 0);

      if (candidates.length === 0) {
        return undefined;
      }

      const byRemainingWeight = (
        firstCandidate: (typeof candidates)[number],
        secondCandidate: (typeof candidates)[number],
      ) => {
        if (firstCandidate.remainingWeight !== secondCandidate.remainingWeight) {
          return secondCandidate.remainingWeight - firstCandidate.remainingWeight;
        }

        return firstCandidate.member.fullName.localeCompare(
          secondCandidate.member.fullName,
          "uk",
        );
      };

      if (pickupAutoMode === "compact") {
        return [...candidates].sort((firstCandidate, secondCandidate) => {
          if (firstCandidate.availableAmount !== secondCandidate.availableAmount) {
            return secondCandidate.availableAmount - firstCandidate.availableAmount;
          }

          return byRemainingWeight(firstCandidate, secondCandidate);
        })[0];
      }

      if (pickupAutoMode === "unloadGirls") {
        return [...candidates].sort((firstCandidate, secondCandidate) => {
          if (firstCandidate.member.gender !== secondCandidate.member.gender) {
            return firstCandidate.member.gender === "female" ? -1 : 1;
          }

          return byRemainingWeight(firstCandidate, secondCandidate);
        })[0];
      }

      const maleAverage = getAverageRemainingWeight("male");
      const femaleAverage = getAverageRemainingWeight("female");
      const preferredGender =
        femaleAverage - maleAverage > maxAverageGenderWeightDifference
          ? "female"
          : "male";
      const preferredCandidates = candidates.filter((candidate) => {
        return candidate.member.gender === preferredGender;
      });

      return [...(preferredCandidates.length > 0 ? preferredCandidates : candidates)].sort(
        byRemainingWeight,
      )[0];
    };

    const addPickupAmount = (
      mealPlan: MealPlan,
      ingredientId: string,
      memberId: string,
      amount: number,
    ) => {
      const pickupIndex = nextPickups.findIndex((pickup) => {
        return (
          pickup.day === mealPlan.day &&
          pickup.mealType === mealPlan.mealType &&
          pickup.ingredientId === ingredientId &&
          pickup.memberId === memberId
        );
      });

      if (pickupIndex >= 0) {
        const pickup = nextPickups[pickupIndex];
        const nextAmount = Math.round((pickup.amount + amount) * 100) / 100;

        nextPickups[pickupIndex] = {
          ...pickup,
          amount: nextAmount,
        };
        return;
      }

      nextPickups.push({
        id: crypto.randomUUID(),
        day: mealPlan.day,
        mealType: mealPlan.mealType,
        memberId,
        ingredientId,
        amount,
        notes: "",
      });
    };

    targetMealPlans.forEach((mealPlan) => {
      const recipeRows = mealIngredientsByMealId[mealPlan.mealId] ?? [];

      recipeRows.forEach((recipeRow) => {
        const ingredient = ingredientsById.get(recipeRow.ingredientId);
        let remainingAmount = Math.max(
          0,
          Math.round(
            (recipeRow.amount -
              getTakenAmount(mealPlan, recipeRow.ingredientId)) *
              100,
          ) / 100,
        );

        while (remainingAmount > 0) {
          const candidate = getCandidate(recipeRow.ingredientId);

          if (!candidate) {
            break;
          }

          const amount = Math.min(1, remainingAmount, candidate.availableAmount);

          addPickupAmount(
            mealPlan,
            recipeRow.ingredientId,
            candidate.member.id,
            amount,
          );
          memberRemainingWeights.set(
            candidate.member.id,
            (memberRemainingWeights.get(candidate.member.id) ?? 0) -
              amount * (ingredient?.weight ?? 0),
          );
          remainingAmount = Math.max(
            0,
            Math.round((remainingAmount - amount) * 100) / 100,
          );
        }
      });
    });

    return nextPickups;
  };

  const automaticallyDistributePickup = () => {
    if (!selectedMealPlan || activeTeamMembers.length === 0) {
      return;
    }

    setFoodPickups(createAutoDistributedPickups([selectedMealPlan]));
  };

  const automaticallyDistributeAllPickups = () => {
    if (sortedAllMealPlans.length === 0 || activeTeamMembers.length === 0) {
      return;
    }

    setFoodPickups(createAutoDistributedPickups(sortedAllMealPlans));
  };

  const resetSelectedPickupDistribution = () => {
    if (!selectedMealPlan) {
      return;
    }

    setFoodPickups(
      foodPickups.filter((pickup) => {
        return !(
          pickup.day === selectedMealPlan.day &&
          pickup.mealType === selectedMealPlan.mealType &&
          activeTeamMemberIds.has(pickup.memberId)
        );
      }),
    );
  };

  const resetAllPickupDistribution = () => {
    setFoodPickups(
      foodPickups.filter((pickup) => {
        return !activeTeamMemberIds.has(pickup.memberId);
      }),
    );
  };

  const hasSelectedPickupDistribution = selectedMealPlan
    ? foodPickups.some((pickup) => {
        return (
          pickup.day === selectedMealPlan.day &&
          pickup.mealType === selectedMealPlan.mealType &&
          activeTeamMemberIds.has(pickup.memberId)
        );
      })
    : false;
  const hasAnyPickupDistribution = foodPickups.some((pickup) => {
    return activeTeamMemberIds.has(pickup.memberId);
  });

  const hasCompletePickupDistribution = useMemo(() => {
    const mealPlansWithRecipe = sortedAllMealPlans.filter((mealPlan) => {
      return (mealIngredientsByMealId[mealPlan.mealId] ?? []).length > 0;
    });

    if (mealPlansWithRecipe.length === 0 || activeTeamMembers.length === 0) {
      return false;
    }

    return mealPlansWithRecipe.every((mealPlan) => {
      const recipeRows = mealIngredientsByMealId[mealPlan.mealId] ?? [];

      return recipeRows.every((recipeRow) => {
        const takenAmount = foodPickups
          .filter((pickup) => {
            return (
              pickup.day === mealPlan.day &&
              pickup.mealType === mealPlan.mealType &&
              pickup.ingredientId === recipeRow.ingredientId &&
              activeTeamMemberIds.has(pickup.memberId)
            );
          })
          .reduce((total, pickup) => total + pickup.amount, 0);

        return takenAmount + 0.001 >= recipeRow.amount;
      });
    });
  }, [
    activeTeamMemberIds,
    activeTeamMembers.length,
    foodPickups,
    mealIngredientsByMealId,
    sortedAllMealPlans,
  ]);

  const pickupWeightPoints = useMemo<PickupWeightPoint[]>(() => {
    if (!hasCompletePickupDistribution) {
      return [];
    }

    const memberRemainingWeights = new Map(
      activeTeamMembers.map((member) => {
        const assignedWeight = foodAssignments
          .filter((assignment) => assignment.memberId === member.id)
          .reduce((total, assignment) => {
            const ingredient = ingredientsById.get(assignment.ingredientId);

            return total + assignment.currentAmount * (ingredient?.weight ?? 0);
          }, 0);

        return [member.id, assignedWeight];
      }),
    );

    const getAverage = (gender: Gender) => {
      const genderMembers = activeTeamMembers.filter((member) => {
        return member.gender === gender;
      });

      if (genderMembers.length === 0) {
        return 0;
      }

      return (
        genderMembers.reduce((total, member) => {
          return total + (memberRemainingWeights.get(member.id) ?? 0);
        }, 0) / genderMembers.length
      );
    };

    const getMax = (gender: Gender) => {
      const genderWeights = activeTeamMembers
        .filter((member) => {
          return member.gender === gender;
        })
        .map((member) => {
          return memberRemainingWeights.get(member.id) ?? 0;
        });

      if (genderWeights.length === 0) {
        return 0;
      }

      return Math.max(...genderWeights);
    };

    const getMin = (gender: Gender) => {
      const genderWeights = activeTeamMembers
        .filter((member) => {
          return member.gender === gender;
        })
        .map((member) => {
          return memberRemainingWeights.get(member.id) ?? 0;
        });

      if (genderWeights.length === 0) {
        return 0;
      }

      return Math.min(...genderWeights);
    };

    return sortedAllMealPlans.map((mealPlan) => {
      foodPickups
        .filter((pickup) => {
          return (
            pickup.day === mealPlan.day &&
            pickup.mealType === mealPlan.mealType &&
            activeTeamMemberIds.has(pickup.memberId)
          );
        })
        .forEach((pickup) => {
          const ingredient = ingredientsById.get(pickup.ingredientId);

          memberRemainingWeights.set(
            pickup.memberId,
            (memberRemainingWeights.get(pickup.memberId) ?? 0) -
              pickup.amount * (ingredient?.weight ?? 0),
          );
        });

      return {
        label: `${formatPlanDate(startDate, mealPlan.day)} ${
          mealTypeLabels[mealPlan.mealType]
        }`,
        maleAverage: Math.max(0, getAverage("male")),
        femaleAverage: Math.max(0, getAverage("female")),
        maleMax: Math.max(0, getMax("male")),
        femaleMax: Math.max(0, getMax("female")),
        maleMin: Math.max(0, getMin("male")),
        femaleMin: Math.max(0, getMin("female")),
      };
    });
  }, [
    activeTeamMemberIds,
    activeTeamMembers,
    foodAssignments,
    foodPickups,
    hasCompletePickupDistribution,
    ingredientsById,
    sortedAllMealPlans,
    startDate,
  ]);

  const chartMaxValue = Math.max(
    1,
    ...pickupWeightPoints.flatMap((point) => {
      return weightChartSeries
        .filter((series) => visibleWeightSeries[series.key])
        .map((series) => point[series.key]);
    }),
  );
  const getChartX = (index: number) => {
    if (pickupWeightPoints.length <= 1) {
      return chartWidth / 2;
    }

    return (
      chartPadding +
      (index / (pickupWeightPoints.length - 1)) *
        (chartWidth - chartPadding * 2)
    );
  };
  const getChartY = (value: number) => {
    return (
      chartHeight -
      chartPadding -
      (value / chartMaxValue) * (chartHeight - chartPadding * 2)
    );
  };
  const getChartPoints = (seriesKey: WeightChartSeriesKey) => {
    return pickupWeightPoints
      .map((point, index) => {
        return `${getChartX(index)},${getChartY(point[seriesKey])}`;
      })
      .join(" ");
  };
  const visibleChartSeries = weightChartSeries.filter((series) => {
    return visibleWeightSeries[series.key];
  });

  const chartGridValues = [0, chartMaxValue / 2, chartMaxValue];

  const pickupCards = useMemo<PickupCard[]>(() => {
    return sortMealPlans(mealPlans).map((mealPlan) => {
      const meal = mealsById.get(mealPlan.mealId);
      const recipeRows = mealIngredientsByMealId[mealPlan.mealId] ?? [];
      const dutyMembers =
        sortedDutySchedules
          .find((dutySchedule) => dutySchedule.day === mealPlan.day)
          ?.memberIds.filter((memberId) => activeTeamMemberIds.has(memberId))
          .map((memberId) => membersById.get(memberId)?.fullName)
          .filter(Boolean)
          .join(", ") || "Чергових не призначено";

      const rows = recipeRows.map((recipeRow) => {
        const ingredient = ingredientsById.get(recipeRow.ingredientId);
        const pickupRows = foodPickups.filter((pickup) => {
            return (
              pickup.day === mealPlan.day &&
              pickup.mealType === mealPlan.mealType &&
              pickup.ingredientId === recipeRow.ingredientId &&
              activeTeamMemberIds.has(pickup.memberId)
            );
          });
        const allocations = pickupRows.map((pickup) => {
          return {
            memberName:
              membersById.get(pickup.memberId)?.fullName ??
              "Учасника не знайдено",
            amount: pickup.amount,
          };
        });
        const takenAmount = pickupRows.reduce((total, pickup) => {
          return total + pickup.amount;
        }, 0);
        const missingAmount = Math.max(
          0,
          Math.round((recipeRow.amount - takenAmount) * 100) / 100,
        );

        return {
          id: recipeRow.id,
          ingredientName: ingredient
            ? `${ingredient.name} ${ingredient.unit}`
            : "Інгредієнт не знайдено",
          amount: recipeRow.amount,
          suppliers: formatSupplierList(
            allocations,
            recipeRow.amount,
            missingAmount,
          ),
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
    activeTeamMemberIds,
    foodPickups,
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

      <section className={css["editorSection"]}>
        <div className={css["editorToolbar"]}>
          <div className={css["editorToolbarTop"]}>
            <h2>Редактор забору продуктів</h2>

            <div className={css["primaryActions"]}>
              <button
                className={css["autoPickupButton"]}
                disabled={!selectedMealPlan || selectedRecipeRows.length === 0}
                type="button"
                onClick={automaticallyDistributePickup}
              >
                Автоматично
              </button>

              <button
                className={css["autoPickupButton"]}
                disabled={
                  sortedAllMealPlans.length === 0 ||
                  activeTeamMembers.length === 0
                }
                type="button"
                onClick={automaticallyDistributeAllPickups}
              >
                Авто на всі дні
              </button>
            </div>
          </div>

          <div className={css["toolbarGroup"]}>
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

          <div className={css["toolbarGrid"]}>
            <div className={css["toolbarGroup"]}>
              <span>День</span>
              <div className={css["segmentedButtons"]}>
                {dayOptions.map((day) => {
                  const isActive = activeDay === day;

                  return (
                    <button
                      className={isActive ? css["activeSegmentButton"] : ""}
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                    >
                      День {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={css["toolbarGroup"]}>
              <span>Прийом їжі</span>
              <div className={css["segmentedButtons"]}>
                {mealTypeOptions.map((mealType) => {
                  const isActive = activeMealType === mealType;

                  return (
                    <button
                      className={isActive ? css["activeSegmentButton"] : ""}
                      key={mealType}
                      type="button"
                      onClick={() => setSelectedMealType(mealType)}
                    >
                      {mealTypeLabels[mealType]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={css["toolbarFooter"]}>
            <label className={css["filterField"]}>
              <span className={css["labelWithTooltip"]}>
                Режим автозаповнення
                <InfoTooltip label="Баланс тримає різницю середньої ваги хлопців і дівчат у межах 1 кг. Інші режими або сильніше розвантажують дівчат, або зменшують кількість людей у заборі." />
              </span>
              <select
                value={pickupAutoMode}
                onChange={(event) =>
                  setPickupAutoMode(event.target.value as PickupAutoMode)
                }
              >
                {(Object.keys(pickupAutoModeLabels) as PickupAutoMode[]).map(
                  (mode) => {
                    return (
                      <option key={mode} value={mode}>
                        {pickupAutoModeLabels[mode]}
                      </option>
                    );
                  },
                )}
              </select>
            </label>

            <div className={css["resetActions"]}>
              <button
                className={css["resetPickupButton"]}
                disabled={!hasSelectedPickupDistribution}
                type="button"
                onClick={resetSelectedPickupDistribution}
              >
                Скинути обраний
              </button>

              <button
                className={css["resetPickupButton"]}
                disabled={!hasAnyPickupDistribution}
                type="button"
                onClick={resetAllPickupDistribution}
              >
                Скинути все
              </button>
            </div>
          </div>
        </div>

        {selectedMealPlan ? (
          <div className={css["pickupEditor"]}>
            <div className={css["selectedMeal"]}>
              {mealsById.get(selectedMealPlan.mealId)?.name ??
                "Страву не знайдено"}
            </div>

            {selectedRecipeRows.length > 0 ? (
              <div className={css["editorRows"]}>
                {selectedRecipeRows.map((recipeRow) => {
                  const ingredient = ingredientsById.get(recipeRow.ingredientId);
                  const takenAmount = getTakenAmountForIngredient(
                    recipeRow.ingredientId,
                  );
                  const remainingAmount = Math.max(
                    0,
                    Math.round((recipeRow.amount - takenAmount) * 100) / 100,
                  );
                  const eligibleMembers = getEligibleMembersForIngredient(
                    recipeRow.ingredientId,
                  );
                  const draft = getDraft(recipeRow);
                  const selectedMemberAvailable = getAvailableAmountForMember(
                    recipeRow.ingredientId,
                    draft.memberId,
                  );
                  const maxAmount = Math.min(
                    selectedMemberAvailable,
                    remainingAmount,
                  );
                  const currentPickups = foodPickups.filter((pickup) => {
                    return (
                      pickup.day === activeDay &&
                      pickup.mealType === activeMealType &&
                      pickup.ingredientId === recipeRow.ingredientId &&
                      activeTeamMemberIds.has(pickup.memberId)
                    );
                  });
                  const isExpanded = expandedRecipeRowIds.has(recipeRow.id);
                  const isFullyTaken = remainingAmount === 0;

                  return (
                    <article
                      className={`${css["editorRow"]} ${
                        isFullyTaken ? css["completedEditorRow"] : ""
                      }`}
                      key={recipeRow.id}
                    >
                      <div className={css["editorRowHeader"]}>
                        <div>
                          <h3>
                            {ingredient
                              ? `${ingredient.name} ${ingredient.unit}`
                              : "Інгредієнт не знайдено"}
                          </h3>
                        </div>

                        <div className={css["editorStats"]}>
                          <div>
                            <small>Всього</small>
                            <strong>{formatNumber(recipeRow.amount)}</strong>
                          </div>
                          <div>
                            <small>Взято</small>
                            <strong>{formatNumber(takenAmount)}</strong>
                          </div>
                          <div>
                            <small>Залишилось</small>
                            <strong>{formatNumber(remainingAmount)}</strong>
                          </div>
                        </div>

                        <button
                          className={css["toggleEditorRowButton"]}
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => toggleRecipeRow(recipeRow.id)}
                        >
                          {isExpanded ? "Згорнути" : "Розгорнути"}
                        </button>
                      </div>

                      {isExpanded ? (
                        <div className={css["editorRowDetails"]}>
                          <div className={css["pickupControls"]}>
                            <label>
                              <span>У кого взяти</span>
                              <select
                                disabled={eligibleMembers.length === 0}
                                value={draft.memberId}
                                onChange={(event) =>
                                  updateDraft(recipeRow.id, {
                                    memberId: event.target.value,
                                  })
                                }
                              >
                                {eligibleMembers.length > 0 ? (
                                  eligibleMembers.map((row) => {
                                    return (
                                      <option
                                        key={row.member.id}
                                        value={row.member.id}
                                      >
                                        {row.member.fullName} - доступно{" "}
                                        {formatNumber(row.availableAmount)}
                                      </option>
                                    );
                                  })
                                ) : (
                                  <option value="">
                                    Немає доступних учасників
                                  </option>
                                )}
                              </select>
                            </label>

                            <label>
                              <span>Кількість</span>
                              <input
                                disabled={!draft.memberId || maxAmount <= 0}
                                min={0}
                                max={maxAmount}
                                step={1}
                                type="number"
                                value={Math.min(draft.amount, maxAmount || 1)}
                                onChange={(event) =>
                                  updateDraft(recipeRow.id, {
                                    amount: Number(event.target.value),
                                  })
                                }
                              />
                            </label>

                            <button
                              disabled={!draft.memberId || maxAmount <= 0}
                              type="button"
                              onClick={() => addPickupForRecipeRow(recipeRow)}
                            >
                              Додати
                            </button>
                          </div>

                          {currentPickups.length > 0 ? (
                            <ul className={css["pickupList"]}>
                              {currentPickups.map((pickup) => {
                                return (
                                  <li key={pickup.id}>
                                    <span>
                                      {membersById.get(pickup.memberId)
                                        ?.fullName ?? "Учасника не знайдено"}
                                    </span>
                                    <strong>{formatNumber(pickup.amount)}</strong>
                                    <button
                                      type="button"
                                      onClick={() => removeFoodPickup(pickup.id)}
                                    >
                                      Видалити
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <div className={css["emptyPickup"]}>
                              Для цього інгредієнта ще нічого не взято.
                            </div>
                          )}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className={css["emptyState"]}>
                Для обраної страви немає рецепту.
              </div>
            )}
          </div>
        ) : (
          <div className={css["emptyState"]}>
            Для обраного дня і прийому їжі немає запису в раціоні.
          </div>
        )}
      </section>

      <section className={css["section"]}>
        <div className={css["sectionHeader"]}>
          <div>
            <div className={css["headingWithTooltip"]}>
              <h2>Динаміка середньої ваги</h2>
              <InfoTooltip label="Графік показує, як зменшується вага продуктів у рюкзаках після кожного прийому їжі. Він зʼявляється тільки після повного розподілу забору продуктів." />
            </div>
          </div>
        </div>

        {hasCompletePickupDistribution && pickupWeightPoints.length > 0 ? (
          <div className={css["weightChartWrap"]}>
            <div className={css["chartControls"]}>
              {weightChartSeries.map((series) => {
                return (
                  <label
                    className={`${css["chartToggle"]} ${
                      css[`${series.key}Toggle`]
                    }`}
                    key={series.key}
                  >
                    <input
                      checked={visibleWeightSeries[series.key]}
                      type="checkbox"
                      onChange={(event) =>
                        setVisibleWeightSeries((currentSeries) => {
                          return {
                            ...currentSeries,
                            [series.key]: event.target.checked,
                          };
                        })
                      }
                    />
                    <span>{series.label}</span>
                  </label>
                );
              })}
            </div>

            <svg
              className={css["weightChart"]}
              role="img"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            >
              {chartGridValues.map((value) => {
                const y = getChartY(value);

                return (
                  <g key={value}>
                    <line
                      className={css["chartGridLine"]}
                      x1={chartPadding}
                      x2={chartWidth - chartPadding}
                      y1={y}
                      y2={y}
                    />
                    <text
                      className={css["chartAxisLabel"]}
                      x={chartPadding - 8}
                      y={y + 4}
                      textAnchor="end"
                    >
                      {formatNumber(value)}
                    </text>
                  </g>
                );
              })}

              {visibleChartSeries.map((series) => {
                return (
                  <polyline
                    className={css[series.lineClassName]}
                    key={series.key}
                    points={getChartPoints(series.key)}
                  />
                );
              })}

              {pickupWeightPoints.map((point, index) => {
                const x = getChartX(index);

                return (
                  <g key={point.label}>
                    {visibleChartSeries.map((series) => {
                      const isAverageSeries = series.key.includes("Average");

                      return (
                        <circle
                          className={css[series.pointClassName]}
                          cx={x}
                          cy={getChartY(point[series.key])}
                          key={series.key}
                          r={isAverageSeries ? "5" : "4"}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </svg>

            <div className={css["chartLabels"]}>
              {pickupWeightPoints.map((point) => {
                return (
                  <div key={point.label}>
                    <strong>{point.label}</strong>
                    <span>
                      Х сер.: {formatNumber(point.maleAverage)} кг / Х макс.:{" "}
                      {formatNumber(point.maleMax)} кг
                    </span>
                    <span>Х мін.: {formatNumber(point.maleMin)} кг</span>
                    <span>
                      Д сер.: {formatNumber(point.femaleAverage)} кг / Д макс.:{" "}
                      {formatNumber(point.femaleMax)} кг
                    </span>
                    <span>Д мін.: {formatNumber(point.femaleMin)} кг</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={css["emptyState"]}>
            Графік з’явиться після повного розподілу продуктів для активної
            бригади.
          </div>
        )}
      </section>

      <section className={css["section"]}>
        <div className={css["sectionHeader"]}>
          <div>
            <h2>Готова розкладка за прийомами їжі</h2>
          </div>

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
