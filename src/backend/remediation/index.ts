import { Task } from "../types";

export function createMockRemediationTasks(): Task[] {
  return [
    { id: "task_001", title: "Enable MFA for all users", status: "open" },
    { id: "task_002", title: "Rotate admin credentials", status: "in_progress" }
  ];
}
