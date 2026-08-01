"use client";

import { useDutyScheduleStore } from "@/stores/dutySchedule";
import { useMealStore } from "@/stores/meals";
import { useMemberStore } from "@/stores/members";
import { useSettingsStore } from "@/stores/settings";
import css from "./Home.module.css";

const createExportFileName = () => {
  const date = new Date().toISOString().slice(0, 10);
  return `camp-planner-export-${date}.json`;
};

const downloadJson = (data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = createExportFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const HomeExportButton = () => {
  const handleExport = () => {
    const memberState = useMemberStore.getState();
    const mealState = useMealStore.getState();
    const dutyScheduleState = useDutyScheduleStore.getState();
    const settingsState = useSettingsStore.getState();

    downloadJson({
      exportedAt: new Date().toISOString(),
      version: 1,
      data: {
        settings: settingsState.settings,
        members: memberState.members,
        ingredients: mealState.ingredients,
        meals: mealState.meals,
        mealIngredients: mealState.mealIngredients,
        mealPlans: mealState.mealPlans,
        dutySchedules: dutyScheduleState.dutySchedules,
        foodAssignments: dutyScheduleState.foodAssignments,
        foodPickups: dutyScheduleState.foodPickups,
      },
    });
  };

  return (
    <button className={css["exportButton"]} type="button" onClick={handleExport}>
      Експортувати JSON
    </button>
  );
};

export default HomeExportButton;
