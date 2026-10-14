export type ProgrammingLanguage = 'JAVA' | 'PYTHON' | 'JAVASCRIPT' | 'TYPESCRIPT';

export type AnalysisFocus = 'CLEAN_CODE' | 'ARCHITECTURE' | 'MODERN_FEATURES' | 'PERFORMANCE' | 'SECURITY';

export type IssueSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type IssueCategory = 'ARCHITECTURE' | 'CLEAN_CODE' | 'SECURITY' | 'PERFORMANCE' | 'BUG_RISK';

export interface CodeFile {
  fileName: string;
  content: string;
}

export interface CodeIssue {
  id: string;
  fileName: string;
  line: number | null;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  description: string;
  recommendation: string;
}

export interface ArchitectureInsight {
  relationshipType: string;
  sourceFile: string;
  targetFile: string;
  description: string;
  suggestion: string;
}

export interface RefactoredFile {
  fileName: string;
  refactoredContent: string;
  changesSummary: string[];
}

export interface GeneratedTest {
  testFileName: string;
  targetFile: string;
  testCode: string;
  framework: string;
}

export interface AnalysisResponse {
  id: string;
  language: ProgrammingLanguage;
  summary: string;
  qualityScore: number;
  issues: CodeIssue[];
  architectureInsights: ArchitectureInsight[];
  refactoredFiles: RefactoredFile[];
  generatedTests: GeneratedTest[];
}

export interface AnalysisRequest {
  language: ProgrammingLanguage;
  focus: AnalysisFocus;
  files: CodeFile[];
}

export interface AnalysisHistoryItem {
  id: string;
  language: ProgrammingLanguage;
  focus: AnalysisFocus;
  qualityScore: number;
  summary: string;
  filesCount: number;
  issuesCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  insightsCount: number;
  createdAt: string;
}

