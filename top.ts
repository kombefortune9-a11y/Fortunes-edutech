import { GoogleGenAI } from "@google/genai";

export interface GenerationParams {
  type?: string;
  curriculumType?: string;
  topic?: string;
  subtopic?: string;
  specificCompetences?: string;
  learningActivities?: string[];
  grade?: string;
  subject?: string;
  school?: string;
  teacherName?: string;
  tsNumber?: string;
  date?: string;
  term?: string;
  year?: string;
  duration?: string;
  testType?: string;
  difficultyLevel?: string;
  testName?: string;
  testDate?: string;
  testDuration?: string;
  questionCounts?: any;
  additionalInstructions?: string;
  includeMarkingKey?: boolean;
  termStartDate?: string;
}

function getAIClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export async function generateEducationalDoc(params: GenerationParams, template: any): Promise<string> {
