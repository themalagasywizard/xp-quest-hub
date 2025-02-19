
interface PerkData {
  id: string;
  name: string;
  tier: string;
  effect: string;
  requirements: string;
  branch: string;
  children?: PerkData[];
}

const strategistPerks: PerkData = {
  id: "strategist-root",
  name: "Strategist",
  tier: "Basic",
  effect: "Unlock the path of the Strategist",
  requirements: "None",
  branch: "Root",
  children: [
    {
      id: "time-management",
      name: "Time Master",
      tier: "Basic",
      effect: "+5% XP from time management activities",
      requirements: "Complete 3 time management quests",
      branch: "Time Management",
      children: [
        {
          id: "pomodoro-master",
          name: "Pomodoro Master",
          tier: "Intermediate",
          effect: "+10% effectiveness during Pomodoro sessions",
          requirements: "Complete 10 Pomodoro sessions",
          branch: "Time Management",
        }
      ]
    },
    {
      id: "deep-work",
      name: "Deep Focus",
      tier: "Basic",
      effect: "+5% XP during focus sessions",
      requirements: "Complete 5 deep work sessions",
      branch: "Deep Work",
      children: [
        {
          id: "flow-state",
          name: "Flow State",
          tier: "Advanced",
          effect: "Increased chance of entering flow state",
          requirements: "Complete 20 deep work sessions",
          branch: "Deep Work",
        }
      ]
    }
  ]
};

const explorerPerks: PerkData = {
  id: "explorer-root",
  name: "Explorer",
  tier: "Basic",
  effect: "Unlock the path of the Explorer",
  requirements: "None",
  branch: "Root",
  children: [
    {
      id: "curiosity",
      name: "Curious Mind",
      tier: "Basic",
      effect: "+5% XP from learning activities",
      requirements: "Complete 3 learning quests",
      branch: "Learning",
      children: [
        {
          id: "knowledge-seeker",
          name: "Knowledge Seeker",
          tier: "Intermediate",
          effect: "Unlock advanced learning quests",
          requirements: "Complete 10 learning activities",
          branch: "Learning",
        }
      ]
    }
  ]
};

const creatorPerks: PerkData = {
  id: "creator-root",
  name: "Creator",
  tier: "Basic",
  effect: "Unlock the path of the Creator",
  requirements: "None",
  branch: "Root",
  children: [
    {
      id: "inspiration",
      name: "Inspired Mind",
      tier: "Basic",
      effect: "+5% XP from creative activities",
      requirements: "Complete 3 creative quests",
      branch: "Creativity",
      children: [
        {
          id: "creative-flow",
          name: "Creative Flow",
          tier: "Intermediate",
          effect: "Increased inspiration during creative sessions",
          requirements: "Complete 10 creative activities",
          branch: "Creativity",
        }
      ]
    }
  ]
};

export function getPerkData(path: string): PerkData {
  switch (path) {
    case "strategist":
      return strategistPerks;
    case "explorer":
      return explorerPerks;
    case "creator":
      return creatorPerks;
    default:
      throw new Error("Invalid perk path");
  }
}
