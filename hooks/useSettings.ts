"use client";

import { useSettingsStore } from "@/stores/settings";

export const useSettings = () => {
  const store = useSettingsStore();

  return {
    settings: store.settings,
    startDate: store.settings.startDate,
    endDate: store.settings.endDate,
    startPoint: store.settings.startPoint,
    endPoint: store.settings.endPoint,
    hasDateRange: Boolean(store.settings.startDate && store.settings.endDate),
    hasRoutePoints: Boolean(store.settings.startPoint && store.settings.endPoint),
    updateSettings: store.updateSettings,
    setSettings: store.setSettings,
    clearSettings: store.clearSettings,
  };
};
