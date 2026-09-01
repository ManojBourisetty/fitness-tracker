"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ActiveWorkoutSession,
  StepEntry,
  UserProfile,
  WeightEntry,
  WorkoutHistoryEntry,
} from "@/lib/types";
import { feetInchesToCm, generateId, todayIso } from "@/lib/utils";

const defaultProfile: UserProfile = {
  name: "Manoj",
  heightCm: feetInchesToCm(6, 1.5),
  startingWeightKg: 115,
  environment: "home",
  equipment: [],
  experience: "beginner",
  primaryGoal:
    "Improve fitness, increase daily activity, build basic strength, and gradually and sustainably reduce body weight.",
  workoutPreference: "Low-impact bodyweight exercise",
  stepGoal: 6000,
  programStartDate: todayIso(),
  theme: "system",
};

type AppState = {
  profile: UserProfile;
  weightEntries: WeightEntry[];
  stepEntries: StepEntry[];
  workoutHistory: WorkoutHistoryEntry[];
  activeSession: ActiveWorkoutSession | null;

  updateProfile: (patch: Partial<UserProfile>) => void;

  addWeightEntry: (entry: Omit<WeightEntry, "id" | "createdAt">) => void;
  removeWeightEntry: (id: string) => void;

  upsertStepEntry: (entry: Omit<StepEntry, "id" | "createdAt">) => void;
  removeStepEntry: (id: string) => void;

  startSession: (session: ActiveWorkoutSession) => void;
  updateSession: (patch: Partial<ActiveWorkoutSession>) => void;
  clearSession: () => void;

  addWorkoutHistory: (entry: Omit<WorkoutHistoryEntry, "id">) => void;
  removeWorkoutHistory: (id: string) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      weightEntries: [],
      stepEntries: [],
      workoutHistory: [],
      activeSession: null,

      updateProfile: (patch) =>
        set((state) => ({ profile: { ...state.profile, ...patch } })),

      addWeightEntry: (entry) =>
        set((state) => ({
          weightEntries: [
            ...state.weightEntries,
            { ...entry, id: generateId(), createdAt: new Date().toISOString() },
          ].sort((a, b) => a.date.localeCompare(b.date)),
        })),
      removeWeightEntry: (id) =>
        set((state) => ({
          weightEntries: state.weightEntries.filter((e) => e.id !== id),
        })),

      upsertStepEntry: (entry) =>
        set((state) => {
          const existing = state.stepEntries.find((e) => e.date === entry.date);
          if (existing) {
            return {
              stepEntries: state.stepEntries.map((e) =>
                e.date === entry.date ? { ...e, ...entry } : e
              ),
            };
          }
          return {
            stepEntries: [
              ...state.stepEntries,
              { ...entry, id: generateId(), createdAt: new Date().toISOString() },
            ].sort((a, b) => a.date.localeCompare(b.date)),
          };
        }),
      removeStepEntry: (id) =>
        set((state) => ({
          stepEntries: state.stepEntries.filter((e) => e.id !== id),
        })),

      startSession: (session) => set({ activeSession: session }),
      updateSession: (patch) =>
        set((state) => ({
          activeSession: state.activeSession ? { ...state.activeSession, ...patch } : null,
        })),
      clearSession: () => set({ activeSession: null }),

      addWorkoutHistory: (entry) =>
        set((state) => ({
          workoutHistory: [
            { ...entry, id: generateId() },
            ...state.workoutHistory,
          ].sort((a, b) => b.date.localeCompare(a.date)),
        })),
      removeWorkoutHistory: (id) =>
        set((state) => ({
          workoutHistory: state.workoutHistory.filter((e) => e.id !== id),
        })),
    }),
    {
      name: "fitness-tracker-store",
      // localStorage today; swap this `storage` for a fetch()-backed adapter
      // (same get/set/remove shape) to move persistence to a real API later
      // without touching any component.
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
