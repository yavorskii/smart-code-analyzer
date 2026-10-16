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

export interface FileMetrics {
  fileName: string;
  totalLines: number;
  sourceLines: number;
  commentLines: number;
  commentRatio: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  complexityRating: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  maintainabilityRating: 'A' | 'B' | 'C' | 'D';
}

export interface CodeMetricsSummary {
  totalLines: number;
  totalSourceLines: number;
  totalCommentLines: number;
  averageCommentRatio: number;
  averageCyclomaticComplexity: number;
  maxCyclomaticComplexity: number;
  totalCognitiveComplexity: number;
  overallMaintainabilityIndex: number;
  maintainabilityRating: string;
  files: FileMetrics[];
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
  metrics?: CodeMetricsSummary;
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

export interface CompilationDiagnostic {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  severity: 'ERROR' | 'WARNING' | 'NOTE';
  message: string;
}

export interface CompilationRequest {
  language: ProgrammingLanguage;
  files: CodeFile[];
}

export interface CompilationResponse {
  success: boolean;
  language: ProgrammingLanguage;
  compilerName: string;
  executionTimeMs: number;
  errorCount: number;
  warningCount: number;
  diagnostics: CompilationDiagnostic[];
  outputLog: string;
}

