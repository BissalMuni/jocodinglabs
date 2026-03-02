import { PracticeData, PracticeStatus } from '@/types';

const STORAGE_KEY = 'ai-tech-tracker-practice';

function getAllPracticeData(): Record<string, PracticeData> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function savePracticeData(data: Record<string, PracticeData>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getPracticeData(techItemId: number): PracticeData {
  const all = getAllPracticeData();
  return all[String(techItemId)] || { status: 'not_started' as PracticeStatus, memo: '' };
}

export function setPracticeStatus(techItemId: number, status: PracticeStatus): void {
  const all = getAllPracticeData();
  const existing = all[String(techItemId)] || { status: 'not_started' as PracticeStatus, memo: '' };
  all[String(techItemId)] = { ...existing, status };
  savePracticeData(all);
}

export function setPracticeMemo(techItemId: number, memo: string): void {
  const all = getAllPracticeData();
  const existing = all[String(techItemId)] || { status: 'not_started' as PracticeStatus, memo: '' };
  all[String(techItemId)] = { ...existing, memo };
  savePracticeData(all);
}

export function deletePracticeData(techItemId: number): void {
  const all = getAllPracticeData();
  delete all[String(techItemId)];
  savePracticeData(all);
}

export { getAllPracticeData };
