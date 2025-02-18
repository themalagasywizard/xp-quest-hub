
export const activityOptions = {
  Focus: [
    { name: "30min Deep Work", xp: 25 },
    { name: "1h Deep Work", xp: 50 },
  ],
  Fitness: [
    { name: "Light Workout", xp: 20 },
    { name: "Intense Workout", xp: 40 },
  ],
  Creativity: [
    { name: "1h Creative Session", xp: 30 },
    { name: "Finished Project", xp: 50 },
  ],
  Learning: [
    { name: "30min Reading", xp: 20 },
    { name: "Course Module", xp: 40 },
  ],
  Wellness: [
    { name: "10min Meditation", xp: 15 },
    { name: "Healthy Meal Prep", xp: 30 },
  ],
} as const;

export type ActivityOptionsKey = keyof typeof activityOptions;
export type Activity = { name: string; xp: number };
