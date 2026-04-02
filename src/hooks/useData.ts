// src/hooks/useData.ts
import { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import { useAuth } from "./useAuth";
import {
  Habit, HabitLog, Meal, WorkoutSession, Exercise,
  Transaction, Goal, JournalEntry, BrianTracyLog, ScheduleEvent, GymStats,
} from "../types";
import { getLogicalDate } from "../lib/dateUtils";

export function useData() {
  const { profile } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [exercises] = useState<Exercise[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [brianTracyLogs, setBrianTracyLogs] = useState<BrianTracyLog[]>([]);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [gymStats, setGymStats] = useState<GymStats | null>(null);
  const [loading, setLoading] = useState(true);

  const today = getLogicalDate();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [
        habitsData,
        habitLogsData,
        mealsData,
        workoutsData,
        statsData,
        transactionsData,
        goalsData,
        journalData,
        brianData,
        scheduleData,
      ] = await Promise.all([
        api.getHabits(),
        api.getHabitLogs({ date: today }),
        api.getMeals(today),
        api.getWorkoutSessions(today),
        api.getGymStats(),
        api.getTransactions(),
        api.getGoals(),
        api.getJournal(today),
        api.getBrianTracy(today),
        api.getSchedule(),
      ]);

      setHabits(habitsData);
      setHabitLogs(habitLogsData);
      setMeals(mealsData);
      setWorkoutSessions(workoutsData);
      setGymStats(statsData);
      setTransactions(transactionsData);
      setGoals(goalsData);
      setJournalEntries(journalData ? [journalData] : []);
      setBrianTracyLogs(brianData ? [brianData] : []);
      setScheduleEvents(scheduleData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    if (!profile) return;
    fetchAll();
  }, [profile, today, fetchAll]);

  return {
    habits,
    habitLogs,
    meals,
    workoutSessions,
    exercises,
    transactions,
    goals,
    journalEntries,
    brianTracyLogs,
    scheduleEvents,
    gymStats,
    loading,
    refresh: fetchAll,
  };
}
