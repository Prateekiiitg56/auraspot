import { Droplets, Zap, Plug, Snowflake, Building, Bug, Sparkles, ClipboardList } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const CATEGORIES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "PLUMBING", label: "Plumbing", icon: Droplets },
  { value: "ELECTRICAL", label: "Electrical", icon: Zap },
  { value: "APPLIANCE", label: "Appliance", icon: Plug },
  { value: "HVAC", label: "AC / heating", icon: Snowflake },
  { value: "STRUCTURAL", label: "Structural", icon: Building },
  { value: "PEST_CONTROL", label: "Pest control", icon: Bug },
  { value: "CLEANING", label: "Cleaning", icon: Sparkles },
  { value: "OTHER", label: "Other", icon: ClipboardList }
];

export const PRIORITIES = [
  { value: "LOW", label: "Low", tone: "status-neutral" },
  { value: "MEDIUM", label: "Medium", tone: "status-info" },
  { value: "HIGH", label: "High", tone: "status-warn" },
  { value: "URGENT", label: "Urgent", tone: "status-danger" }
];

export const STATUSES = [
  { value: "PENDING", label: "Pending", tone: "status-warn" },
  { value: "APPROVED", label: "Approved", tone: "status-info" },
  { value: "IN_PROGRESS", label: "In progress", tone: "status-info" },
  { value: "RESOLVED", label: "Resolved", tone: "status-ok" },
  { value: "REJECTED", label: "Rejected", tone: "status-danger" }
];

export const categoryOf = (value: string) => CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1];
export const statusOf = (value: string) => STATUSES.find((s) => s.value === value) || STATUSES[0];
export const priorityOf = (value: string) => PRIORITIES.find((p) => p.value === value) || PRIORITIES[1];
