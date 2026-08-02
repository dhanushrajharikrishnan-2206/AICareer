// File-based Persistent Prisma Client Mock
// Provides true local persistence on disk via prisma_db.json, allowing full data retention
// across container reloads and app restarts without requiring an external PostgreSQL database.

import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "prisma_db.json");

// Helper to load state from disk
function loadDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse prisma_db.json, starting fresh:", e);
    }
  }
  return {};
}

// Helper to save state to disk safely via atomic write
function saveDb(data: any) {
  try {
    const tempFile = `${DB_FILE}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (e) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save to prisma_db.json:", err);
    }
  }
}

class MockModel<T extends { id: string }> {
  items: T[];
  name: string;
  getRelation?: (item: T, include: any) => Promise<any>;
  onStateChange: () => void;

  constructor(
    name: string,
    initialItems: T[] = [],
    onStateChange: () => void,
    getRelation?: (item: T, include: any) => Promise<any>
  ) {
    this.name = name;
    this.items = initialItems;
    this.onStateChange = onStateChange;
    this.getRelation = getRelation;
  }

  async findMany(options?: any) {
    let result = [...this.items];
    if (options?.where) {
      result = result.filter(item => this.matchesWhere(item, options.where));
    }
    if (options?.orderBy) {
      const field = Object.keys(options.orderBy)[0];
      const dir = options.orderBy[field];
      result.sort((a: any, b: any) => {
        const valA = a[field] instanceof Date ? a[field].getTime() : a[field];
        const valB = b[field] instanceof Date ? b[field].getTime() : b[field];
        if (valA < valB) return dir === 'desc' ? 1 : -1;
        if (valA > valB) return dir === 'desc' ? -1 : 1;
        return 0;
      });
    }
    if (options?.skip !== undefined) {
      result = result.slice(options.skip);
    }
    if (options?.take !== undefined) {
      result = result.slice(0, options.take);
    }

    // Apply joins / include relations
    if (options?.include && this.getRelation) {
      result = await Promise.all(result.map(async (item) => {
        const itemCopy = { ...item };
        await this.getRelation!(itemCopy, options.include);
        return itemCopy;
      }));
    }

    if (options?.select) {
      result = result.map(item => this.applySelect(item, options.select));
    }
    return result;
  }

  async findFirst(options?: any) {
    const list = await this.findMany(options);
    return list[0] || null;
  }

  async findUnique(options?: any) {
    return this.findFirst(options);
  }

  async create(options: any) {
    const data = options.data;
    const newItem = {
      id: data.id || Math.random().toString(36).substring(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    } as any;
    this.items.push(newItem);
    this.onStateChange();
    return newItem;
  }

  async createMany(options: any) {
    const dataList = options.data || [];
    const created = [];
    for (const data of dataList) {
      const newItem = {
        id: data.id || Math.random().toString(36).substring(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      } as any;
      this.items.push(newItem);
      created.push(newItem);
    }
    this.onStateChange();
    return { count: created.length };
  }

  async update(options: any) {
    const where = options.where;
    const data = options.data;
    const item = this.items.find(i => this.matchesWhere(i, where));
    if (!item) {
      // Return a gracefully created item if it doesn't exist to prevent crash
      return this.create({ data: { ...where, ...data } });
    }
    Object.assign(item, data);
    (item as any).updatedAt = new Date();
    this.onStateChange();
    return item;
  }

  async upsert(options: any) {
    const where = options.where;
    const createData = options.create;
    const updateData = options.update;
    let item = this.items.find(i => this.matchesWhere(i, where));
    if (item) {
      Object.assign(item, updateData);
      (item as any).updatedAt = new Date();
      this.onStateChange();
      return item;
    } else {
      // Resolve composite keys in createData if present
      const resolvedCreate = { ...createData };
      if (where.userId_jobId) {
        resolvedCreate.userId = resolvedCreate.userId || where.userId_jobId.userId;
        resolvedCreate.jobId = resolvedCreate.jobId || where.userId_jobId.jobId;
      }
      return this.create({ data: resolvedCreate });
    }
  }

  async delete(options: any) {
    const where = options.where;
    const index = this.items.findIndex(i => this.matchesWhere(i, where));
    if (index === -1) {
      return {};
    }
    const removed = this.items.splice(index, 1)[0];
    this.onStateChange();
    return removed;
  }

  async deleteMany(options?: any) {
    if (!options?.where) {
      const count = this.items.length;
      this.items = [];
      this.onStateChange();
      return { count };
    }
    const initialCount = this.items.length;
    this.items = this.items.filter(item => !this.matchesWhere(item, options.where));
    const count = initialCount - this.items.length;
    this.onStateChange();
    return { count };
  }

  async count(options?: any) {
    const list = await this.findMany(options);
    return list.length;
  }

  private matchesWhere(item: any, where: any): boolean {
    if (!where || Object.keys(where).length === 0) return true;
    for (const key of Object.keys(where)) {
      const val = where[key];
      if (val === undefined) continue;

      if (key === 'AND') {
        if (Array.isArray(val)) {
          if (!val.every(cond => this.matchesWhere(item, cond))) return false;
        }
        continue;
      }

      if (key === 'OR') {
        if (Array.isArray(val) && val.length > 0) {
          if (!val.some(cond => this.matchesWhere(item, cond))) return false;
        }
        continue;
      }

      if (key === 'NOT') {
        if (Array.isArray(val)) {
          if (val.some(cond => this.matchesWhere(item, cond))) return false;
        } else if (typeof val === 'object' && val !== null) {
          if (this.matchesWhere(item, val)) return false;
        }
        continue;
      }

      // Support composite unique constraints (e.g. userId_jobId)
      if (key === 'userId_jobId' && typeof val === 'object' && val !== null) {
        if (item.userId !== val.userId || item.jobId !== val.jobId) {
          return false;
        }
        continue;
      }

      if (typeof val === 'object' && val !== null) {
        if ('contains' in val) {
          const itemVal = String(item[key] || "");
          const searchVal = String(val.contains || "");
          const isInsensitive = val.mode === "insensitive";
          if (isInsensitive) {
            if (!itemVal.toLowerCase().includes(searchVal.toLowerCase())) return false;
          } else {
            if (!itemVal.includes(searchVal)) return false;
          }
        } else if ('startsWith' in val) {
          const itemVal = String(item[key] || "");
          const searchVal = String(val.startsWith || "");
          const isInsensitive = val.mode === "insensitive";
          if (isInsensitive) {
            if (!itemVal.toLowerCase().startsWith(searchVal.toLowerCase())) return false;
          } else {
            if (!itemVal.startsWith(searchVal)) return false;
          }
        } else if ('endsWith' in val) {
          const itemVal = String(item[key] || "");
          const searchVal = String(val.endsWith || "");
          const isInsensitive = val.mode === "insensitive";
          if (isInsensitive) {
            if (!itemVal.toLowerCase().endsWith(searchVal.toLowerCase())) return false;
          } else {
            if (!itemVal.endsWith(searchVal)) return false;
          }
        } else if ('in' in val) {
          if (!Array.isArray(val.in) || !val.in.includes(item[key])) return false;
        } else if ('equals' in val) {
          if (item[key] !== val.equals) return false;
        } else if ('gte' in val || 'lte' in val || 'gt' in val || 'lt' in val) {
          const itemVal = item[key] instanceof Date ? item[key].getTime() : item[key];
          if ('gte' in val) {
            const comp = val.gte instanceof Date ? val.gte.getTime() : val.gte;
            if (itemVal < comp) return false;
          }
          if ('lte' in val) {
            const comp = val.lte instanceof Date ? val.lte.getTime() : val.lte;
            if (itemVal > comp) return false;
          }
          if ('gt' in val) {
            const comp = val.gt instanceof Date ? val.gt.getTime() : val.gt;
            if (itemVal <= comp) return false;
          }
          if ('lt' in val) {
            const comp = val.lt instanceof Date ? val.lt.getTime() : val.lt;
            if (itemVal >= comp) return false;
          }
        } else {
          if (JSON.stringify(item[key]) !== JSON.stringify(val)) return false;
        }
      } else {
        if (item[key] !== val) return false;
      }
    }
    return true;
  }

  private applySelect(item: any, select: any) {
    if (!select) return item;
    const selected: any = {};
    for (const key of Object.keys(select)) {
      if (select[key]) {
        selected[key] = item[key];
      }
    }
    return selected;
  }
}

// Global state holders for persistence across API loads
const globalMock = global as any;

// Load persisted database
const persistedDb = loadDb();

function triggerSync() {
  const data = {
    users: globalMock.__users,
    resumes: globalMock.__resumes,
    resumeAnalyses: globalMock.__resumeAnalyses,
    coverLetters: globalMock.__coverLetters,
    coachMessages: globalMock.__coachMessages,
    jobs: globalMock.__jobs,
    savedJobs: globalMock.__savedJobs,
    skillProgress: globalMock.__skillProgress,
    mockInterviews: globalMock.__mockInterviews,
  };
  saveDb(data);
}

if (!globalMock.__users) {
  globalMock.__users = persistedDb.users || [];
  globalMock.__resumes = persistedDb.resumes || [];
  globalMock.__resumeAnalyses = persistedDb.resumeAnalyses || [];
  globalMock.__coverLetters = persistedDb.coverLetters || [];
  globalMock.__coachMessages = persistedDb.coachMessages || [];
  globalMock.__savedJobs = persistedDb.savedJobs || [];
  globalMock.__skillProgress = persistedDb.skillProgress || [];
  globalMock.__mockInterviews = persistedDb.mockInterviews || [];

  // Ensure demo user exists
  if (globalMock.__users.length === 0 || !globalMock.__users.some((u: any) => u.email === "demo@example.com")) {
    globalMock.__users.push({
      id: "demo-user-id",
      createdAt: new Date(),
      updatedAt: new Date(),
      name: "Demo User",
      email: "demo@example.com",
      passwordHash: "$2a$10$KMlygfu0ljA8tmssFvf4geIqIMuuV5B0YJKRiRkbb27NPSQE1VUBK" // password123
    });
  }

  // Seed default jobs board
  globalMock.__jobs = persistedDb.jobs || [
    {
      id: "job-1",
      title: "Senior React Engineer",
      company: "InnovateTech Solutions",
      location: "San Francisco, CA (Hybrid)",
      description: "We are looking for a Senior React Engineer experienced in modern state management, Tailwind CSS, Next.js, and TypeScript. You will lead development on our AI analytics dashboards, optimize performance, and mentor junior devs.",
      url: "https://example.com/jobs/react-engineer",
      postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      id: "job-2",
      title: "Full Stack Developer",
      company: "CloudCore Systems",
      location: "Remote (US/Canada)",
      description: "Seeking a versatile Full Stack Developer skilled in Node.js, Next.js/React, and relational databases. Experience with Docker, CI/CD pipelines, and cloud hosting (GCP/AWS) is highly desired. Will contribute to core user APIs.",
      url: "https://example.com/jobs/fullstack-dev",
      postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: "job-3",
      title: "Product Designer (UX/UI)",
      company: "CreativeFlow Studio",
      location: "New York, NY",
      description: "CreativeFlow is looking for a UI/UX designer who loves typography, visual systems, and clean workflows. You will design web apps and interactive visualizer tools, conducting user research and producing high-fidelity Figma prototypes.",
      url: "https://example.com/jobs/designer",
      postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: "job-4",
      title: "AI Support Integration Specialist",
      company: "FutureScale AI",
      location: "Austin, TX (On-site)",
      description: "Join our fast-growing AI integrations team. Responsibilities include deploying large language models, setting up RESTful API proxy servers, implementing multi-turn chat agents, and building resume analysis pipelines.",
      url: "https://example.com/jobs/ai-specialist",
      postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  ];

  // If no jobs exist in persistedDb, ensure jobs are synchronized to disk
  if (!persistedDb.jobs || persistedDb.jobs.length === 0) {
    triggerSync();
  }
}

const mockUser = new MockModel<any>("User", globalMock.__users, triggerSync);
const mockResume = new MockModel<any>("Resume", globalMock.__resumes, triggerSync);
const mockResumeAnalysis = new MockModel<any>("ResumeAnalysis", globalMock.__resumeAnalyses, triggerSync);
const mockCoverLetter = new MockModel<any>("CoverLetter", globalMock.__coverLetters, triggerSync);
const mockCoachMessage = new MockModel<any>("CoachMessage", globalMock.__coachMessages, triggerSync);
const mockJob = new MockModel<any>("Job", globalMock.__jobs, triggerSync);
const mockSavedJob = new MockModel<any>("SavedJob", globalMock.__savedJobs, triggerSync, async (item, include) => {
  if (include.job) {
    item.job = globalMock.__jobs.find((j: any) => j.id === item.jobId) || null;
  }
});
const mockSkillProgress = new MockModel<any>("SkillProgress", globalMock.__skillProgress, triggerSync);
const mockMockInterview = new MockModel<any>("MockInterview", globalMock.__mockInterviews, triggerSync);

export const prisma = {
  user: mockUser,
  resume: mockResume,
  resumeAnalysis: mockResumeAnalysis,
  coverLetter: mockCoverLetter,
  coachMessage: mockCoachMessage,
  job: mockJob,
  savedJob: mockSavedJob,
  skillProgress: mockSkillProgress,
  mockInterview: mockMockInterview,
};

export type PrismaClientMock = typeof prisma;
