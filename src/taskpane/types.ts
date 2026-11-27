export interface EmailLink {
  text: string;
  href: string;
}

export interface EmailData {
  from: { name: string; address: string };
  subject: string;
  body: string;
  headers: string;
  links: EmailLink[];
  attachments: string[];
}

export type RiskLevel = "high" | "medium" | "low";
export type IssueType = "link" | "urgency" | "sender" | "attachment" | "request" | "impersonation" | "other";

export interface Issue {
  type: IssueType;
  title: string;
  evidence: string;
  explanation: string;
  assistantHeadline: string;
  assistantDetail: string;
}

export interface Analysis {
  riskLevel: RiskLevel;
  summary: string;
  issues: Issue[];
  recommendation: string;
}

export interface AssistantPoint {
  headline: string;
  detail: string;
}

export interface AssistantReply {
  answer: string;
  points: AssistantPoint[];
  recommendation: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}