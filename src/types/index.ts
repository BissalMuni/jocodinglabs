// Tech Item types
export interface TechItem {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  introducedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TechItemWithRelations extends TechItem {
  category: Category;
  sourceVideos: SourceVideo[];
}

// Source Video types
export interface SourceVideo {
  id: number;
  url: string;
  title: string;
  publishedAt: string;
  createdAt: string;
}

// Category types
export interface Category {
  id: number;
  name: string;
  sortOrder: number;
}

// Extraction Job types
export type ExtractionJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ExtractionJob {
  id: number;
  status: ExtractionJobStatus;
  videoUrls: string;
  result: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ExtractedItem {
  name: string;
  description: string;
  url: string;
  suggestedCategory: string;
}

export interface ExtractionResult {
  videoUrl: string;
  videoTitle: string;
  extractedItems: ExtractedItem[];
  error?: string;
}

// Practice data (localStorage)
export type PracticeStatus = 'not_started' | 'in_progress' | 'completed';

export interface PracticeData {
  status: PracticeStatus;
  memo: string;
}

// API Error
export interface ApiError {
  error: string;
  code: string;
}

// API Response types
export interface TechItemsResponse {
  items: TechItemWithRelations[];
  total: number;
}

export interface CategoriesResponse {
  categories: Category[];
}
