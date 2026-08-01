import { CampSettings } from "@/types/settings";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsStore {
  settings: CampSettings;
  updateSettings: (body: Partial<CampSettings>) => void;
  setSettings: (settings: CampSettings) => void;
  clearSettings: () => void;
}

const initialSettings: CampSettings = {
  startDate: "",
  endDate: "",
  startPoint: "",
  endPoint: "",
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (setStore) => {
      return {
        settings: initialSettings,

        updateSettings: (body) => {
          setStore((store) => {
            return {
              settings: {
                ...store.settings,
                ...body,
              },
            };
          });
        },

        setSettings: (settings) => {
          setStore({ settings: { ...initialSettings, ...settings } });
        },

        clearSettings: () => {
          setStore({ settings: initialSettings });
        },
      };
    },
    {
      name: "SettingsStore",
      merge: (persistedState, currentState) => {
        const persistedSettings =
          typeof persistedState === "object" &&
          persistedState !== null &&
          "settings" in persistedState &&
          typeof persistedState.settings === "object" &&
          persistedState.settings !== null
            ? persistedState.settings
            : {};

        return {
          ...currentState,
          ...(typeof persistedState === "object" && persistedState !== null
            ? persistedState
            : {}),
          settings: {
            ...initialSettings,
            ...persistedSettings,
          },
        };
      },
    },
  ),
);
