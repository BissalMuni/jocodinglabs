'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PracticeStatus } from '@/types';
import { getAllPracticeData } from '@/lib/local-storage';
import TechCard from './tech-card';
import VideoGroupSection from './video-group-section';
import CategoryFilter from './category-filter';
import SearchBar from './search-bar';

interface SourceVideo {
  id: number;
  url: string;
  title: string;
}

interface Category {
  id: number;
  name: string;
  sortOrder: number;
}

interface TechItem {
  id: number;
  name: string;
  description: string;
  url: string | null;
  category: Category | null;
  introducedAt: string;
  sourceVideos: SourceVideo[];
  createdAt: string;
}

interface VideoGroup {
  video: {
    id: number;
    title: string;
    url: string;
    publishedAt: string;
  };
  items: TechItem[];
}

export default function TechList() {
  const [groups, setGroups] = useState<VideoGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [practiceFilter, setPracticeFilter] = useState<PracticeStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('groupBy', 'video');
      if (selectedCategory) params.set('category', String(selectedCategory));
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/tech-items?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch tech items');
      const data = await res.json();
      setGroups(data.groups ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는 데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data.categories);
    } catch {
      // Categories are non-critical, silently fail
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Apply practice filter to groups
  const filteredGroups = practiceFilter === 'all'
    ? groups
    : groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            const practiceData = getAllPracticeData();
            const practice = practiceData[String(item.id)];
            if (practiceFilter === 'not_started') {
              return !practice || practice.status === 'not_started';
            }
            return practice?.status === practiceFilter;
          }),
        }))
        .filter((group) => group.items.length > 0);

  const totalItems = filteredGroups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="space-y-6">
      <SearchBar
        onSearch={setSearchQuery}
        onPracticeFilter={setPracticeFilter}
        showPracticeFilter={true}
        practiceFilter={practiceFilter}
      />
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
      />
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-5">
              <div className="h-5 w-1/3 rounded bg-gray-200" />
              <div className="mt-3 h-4 w-full rounded bg-gray-200" />
              <div className="mt-2 h-4 w-2/3 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
          {error}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          검색 결과가 없습니다
        </div>
      ) : (
        <div className="space-y-8">
          {filteredGroups.map((group) => (
            <VideoGroupSection
              key={group.video.id}
              video={group.video}
              items={group.items}
            />
          ))}
          <p className="text-center text-xs text-gray-400">
            총 {filteredGroups.length}개 영상, {totalItems}개 기술
          </p>
        </div>
      )}
      <p className="text-center text-xs text-gray-400">
        실습 데이터는 브라우저 로컬 저장소에 저장됩니다. 브라우저 데이터 삭제 시 유실될 수 있습니다.
      </p>
    </div>
  );
}
