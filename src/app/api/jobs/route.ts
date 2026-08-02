import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Phase 3: Job Search
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const location = searchParams.get("location") || "";

  // Auto-seed jobs if DB has 0 jobs
  const count = await prisma.job.count();
  if (count === 0) {
    const seedJobs = [
      {
        title: "Senior Frontend Engineer (React/Next.js)",
        company: "Stripe",
        location: "Remote (USA/Canada)",
        url: "https://stripe.com/jobs",
        description: `About the Role:
We are looking for a Senior Frontend Engineer to join our dashboard platform squad. You will lead the migration of business-critical billing interfaces to Next.js App Router and design components used by millions of global merchants.

Key Responsibilities:
- Build low-latency dashboards and analytical telemetry widgets in React.
- Collaborate with Product Designers to refine design systems based on Tailwind and accessible Radix components.
- Optimize client-side bundle structures to achieve maximum responsive performance.

Ideal Qualifications:
- 5+ years of production experience in TypeScript and React.
- Deep expertise in server-driven rendering (Next.js, SSR, React Server Components).
- Outstanding attention to visual craft, interactive transitions, and responsive typography.`,
        postedAt: new Date(Date.now() - 3600000 * 4) // 4 hours ago
      },
      {
        title: "Staff AI Systems Architect",
        company: "Google",
        location: "Mountain View, CA",
        url: "https://google.com/careers",
        description: `About the Role:
Google is seeking an expert Staff Systems Architect to scale AI/ML pipeline middleware. You will design developer tooling integration layers for Gemini models, focusing on latency, cost-efficiency, and tool-use grounding APIs.

Key Responsibilities:
- Lead systems architecture for high-concurrency LLM inference nodes.
- Orchestrate secure vector database retrievals (RAG) and function-calling pathways.
- Define developer SDK guidelines for Gemini API interfaces.

Ideal Qualifications:
- Master’s/PhD in Computer Science, or equivalent depth in distributed computing.
- Strong proficiency in Go, C++, or Rust, and high-performance Python wrappers.
- Experience with large-scale semantic caching and orchestration libraries.`,
        postedAt: new Date(Date.now() - 3600000 * 24) // 1 day ago
      },
      {
        title: "UI/UX Product Designer",
        company: "Figma",
        location: "San Francisco, CA (Hybrid)",
        url: "https://figma.com/careers",
        description: `About the Role:
Join the team defining the future of design and code collaboration. As a Product Designer, you will design innovative playground workspaces, developer inspector modes, and automated asset generation workflows.

Key Responsibilities:
- Map end-to-end user journeys for developer-focused canvas tooling.
- Create ultra-polished Figma components, motion specs, and high-fidelity interactive web prototypes.
- Conduct regular developer usability studies to locate and bypass workflow friction.

Ideal Qualifications:
- 3+ years designing complex SaaS products, creative editors, or layout canvases.
- Strong UI craftsmanship, micro-interaction design, and typography pairing.
- Basic understanding of CSS/HTML layouts (Flexbox, Grid) to ease handoff.`,
        postedAt: new Date(Date.now() - 3600000 * 36) // 1.5 days ago
      },
      {
        title: "Senior Full Stack Architect",
        company: "Vercel",
        location: "Remote (Worldwide)",
        url: "https://vercel.com/careers",
        description: `About the Role:
Vercel is looking for a Senior Full Stack Architect to build and expand next-generation Edge Middleware and Serverless capabilities. Shape the infrastructure powering the modern web.

Key Responsibilities:
- Design real-time telemetry APIs and developer dashboard controls.
- Maintain and enhance edge-runtime node configurations and distributed state handlers.
- Draft technical proposals and represent developer-centric priorities.

Ideal Qualifications:
- 6+ years building global web application architectures.
- Expert skill with Node.js, V8 Edge runtimes, and PostgreSQL/Prisma.
- Deep passion for standard web APIs, performance telemetry, and modern developer experience.`,
        postedAt: new Date(Date.now() - 3600000 * 48) // 2 days ago
      },
      {
        title: "Product Manager (Growth & Recommendation Feed)",
        company: "Netflix",
        location: "Los Gatos, CA",
        url: "https://netflix.com/careers",
        description: `About the Role:
We are looking for a Growth Product Manager to own recommendation algorithms and cohort optimization models. Drive organic user retention and sign-up flows across smart-TV and web platforms.

Key Responsibilities:
- Define vision and roadmap for A/B testing frameworks across personalized landing layouts.
- Lead multi-disciplinary pods of engineers, data scientists, and creative writers.
- Translate business requirements into elegant functional requirements.

Ideal Qualifications:
- 4+ years of product management experience, preferably in high-growth consumer SaaS/streaming.
- Data-driven mindset with advanced experience in SQL, statistical modeling, and experimental design.
- Excellent interpersonal skill to align engineering and creative teams.`,
        postedAt: new Date(Date.now() - 3600000 * 72) // 3 days ago
      },
      {
        title: "DevOps & Cloud Infrastructure Engineer",
        company: "Amazon Web Services (AWS)",
        location: "Seattle, WA",
        url: "https://aws.amazon.com/careers",
        description: `About the Role:
AWS is hiring a Cloud Infrastructure Engineer to lead automated deployment patterns and container orchestration tooling (EKS/Fargate). Help enterprise teams build zero-downtime microservice clusters.

Key Responsibilities:
- Draft Terraform scripts and configure automated CI/CD pipelines.
- Establish secure multi-tenant network architectures, IAM configurations, and cloud firewalls.
- Troubleshoot high-throughput database replication clusters.

Ideal Qualifications:
- 4+ years of experience managing production Linux infrastructure.
- Expert knowledge of Docker, Kubernetes, and IaC (Terraform, CloudFormation).
- Experience setting up monitoring networks (Prometheus, Grafana, CloudWatch).`,
        postedAt: new Date(Date.now() - 3600000 * 96) // 4 days ago
      }
    ];

    await prisma.job.createMany({
      data: seedJobs
    });
  }

  const jobs = await prisma.job.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { company: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } }
              ]
            }
          : {},
        location ? { location: { contains: location, mode: "insensitive" } } : {}
      ]
    },
    orderBy: { postedAt: "desc" },
    take: 50
  });

  return NextResponse.json(jobs);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, company, location, description, url } = body;

    if (!title || !company || !description) {
      return NextResponse.json({ error: "Missing required fields (title, company, description)" }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        title,
        company,
        location: location || "Remote",
        description,
        url: url || "",
        postedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, job });
  } catch (err: any) {
    console.error("Failed to create job:", err);
    return NextResponse.json({ error: err.message || "Failed to create job" }, { status: 500 });
  }
}
