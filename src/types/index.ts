export type ResumeContent = {
  summary: string;
  experience: {
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }[];
  education: {
    school: string;
    degree: string;
    year: string;
  }[];
  skills: string[];
};

export type AnalysisResult = {
  atsScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};
