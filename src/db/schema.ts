import { pgTable, text, timestamp, integer, jsonb, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // cuid compatible
  name: text("name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: text("role").default("USER").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resumes = pgTable("resumes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").default("Untitled resume").notNull(),
  content: jsonb("content").notNull(), // structured resume data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resumeAnalyses = pgTable("resume_analyses", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  resumeId: text("resume_id").notNull().references(() => resumes.id, { onDelete: "cascade" }),
  jobTitle: text("job_title"),
  atsScore: integer("ats_score"),
  strengths: jsonb("strengths"),
  weaknesses: jsonb("weaknesses"),
  suggestions: jsonb("suggestions"),
  rawResponse: text("raw_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const coverLetters = pgTable("cover_letters", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  resumeId: text("resume_id").notNull().references(() => resumes.id, { onDelete: "cascade" }),
  jobTitle: text("job_title").notNull(),
  company: text("company").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const coachMessages = pgTable("coach_messages", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  description: text("description").notNull(),
  url: text("url"),
  postedAt: timestamp("posted_at").defaultNow().notNull(),
});

export const savedJobs = pgTable("saved_jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  matchScore: integer("match_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.userId, t.jobId)
}));

export const skillProgresses = pgTable("skill_progresses", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  skillName: text("skill_name").notNull(),
  status: text("status").default("not_started").notNull(), // not_started | in_progress | done
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mockInterviews = pgTable("mock_interviews", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // technical | hr | aptitude
  questions: jsonb("questions").notNull(),
  answers: jsonb("answers"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
