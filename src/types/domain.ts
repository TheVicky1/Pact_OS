// PACT Core Domain TypeScript Type Definitions

export type GoalStatus = 'active' | 'completed' | 'archived';
export type ProjectStatus = 'active' | 'completed' | 'paused' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'missed' | 'archived';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  goal_id: string | null;
  title: string;
  description: string | null;
  color_accent: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  goal_id: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  deadline_at: string;
  completed_at: string | null;
  missed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string | null;
  target_date?: string | null;
}

export interface CreateProjectInput {
  title: string;
  goal_id?: string | null;
  description?: string | null;
  color_accent?: string | null;
}

export interface CreateTaskInput {
  title: string;
  deadline_at: string;
  project_id?: string | null;
  goal_id?: string | null;
  description?: string | null;
  priority?: TaskPriority;
  accountability_mode?: AccountabilityMode;
  consequence_id?: string | null;
}

// Phase 3 Accountability Domain Types
export type ConsequenceType =
  | 'personal_restriction'
  | 'extra_responsibility'
  | 'self_improvement'
  | 'reflection'
  | 'financial_declaration'
  | 'custom';

export type AccountabilityMode = 'default' | 'explicit' | 'none';
export type CommitmentStatus = 'committed' | 'activated' | 'fulfilled' | 'waived';

export interface ConsequenceSnapshot {
  title: string;
  consequence_type: ConsequenceType;
  action_statement: string;
  description: string | null;
}

export interface ConsequenceDefinition {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  consequence_type: ConsequenceType;
  action_statement: string;
  is_enabled: boolean;
  is_default: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface UserAccountabilityPreferences {
  user_id: string;
  default_consequence_id: string | null;
  auto_apply_default: boolean;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type AccountabilityEventType = 'activated' | 'fulfilled' | 'waived' | 'resolved';

export interface TaskAccountabilityCommitment {
  id: string;
  task_id: string;
  user_id: string;
  source_consequence_id: string | null;
  consequence_snapshot: ConsequenceSnapshot;
  commitment_status: CommitmentStatus;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountabilityEvent {
  id: string;
  user_id: string;
  task_id: string;
  commitment_id: string;
  event_type: AccountabilityEventType;
  metadata: Record<string, unknown> | null;
  created_at: string;
}


export interface CreateConsequenceDefinitionInput {
  title: string;
  consequence_type: ConsequenceType;
  action_statement: string;
  description?: string | null;
  is_enabled?: boolean;
  is_default?: boolean;
  priority?: number;
}

export interface UpdateConsequenceDefinitionInput {
  title?: string;
  consequence_type?: ConsequenceType;
  action_statement?: string;
  description?: string | null;
  is_enabled?: boolean;
  is_default?: boolean;
  priority?: number;
}

export interface UpdateUserAccountabilityPreferencesInput {
  default_consequence_id?: string | null;
  auto_apply_default?: boolean;
  is_enabled?: boolean;
}


