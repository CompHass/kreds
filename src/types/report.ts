// Report types — Phase 9 (weekly guardian reports per child)

export interface ChildWeeklyReport {
  childId: string
  displayName: string
  accentColor: string
  tasksCompleted: number
  tasksTotal: number
  kredsEarned: number // available + firstfruits earned this cycle
  firstfruitsSeparated: number
  savingsAllocated: number | null
  savingsGoal: number | null
}

export interface FamilyWeeklyReport {
  cycleStart: string
  children: ChildWeeklyReport[]
}
