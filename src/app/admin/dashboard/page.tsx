'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TechForm from '@/components/admin/tech-form';

interface Category {
  id: number;
  name: string;
  sortOrder: number;
}

interface TechItem {
  id: number;
  name: string;
  description: string;
  category: Category | null;
  introducedAt: string;
  sourceVideos: { id: number; url: string; title: string }[];
  createdAt: string;
}

export default function AdminDashboard() {
  const [items, setItems] = useState<TechItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingItem, setEditingItem] = useState<TechItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getToken = useCallback(() => {
    const token = sessionStorage.getItem('admin-token');
    if (!token) {
      router.push('/admin');
      return null;
    }
    return token;
  }, [router]);

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoading(true);
      const [itemsRes, catsRes] = await Promise.all([
        fetch('/api/tech-items'),
        fetch('/api/categories'),
      ]);
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItems(data.items);
      }
      if (catsRes.ok) {
        const data = await catsRes.json();
        setCategories(data.categories);
      }
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const token = getToken();
    if (!token) return;
    const res = await fetch(`/api/admin/tech-items/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleSave = async (data: {
    name: string;
    description: string;
    categoryId: number;
    introducedAt: string;
    sourceVideoUrls: string[];
  }) => {
    const token = getToken();
    if (!token) return;

    if (editingItem) {
      const res = await fetch(`/api/admin/tech-items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowForm(false);
        setEditingItem(null);
        fetchData();
      }
    } else {
      const res = await fetch('/api/admin/tech-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowForm(false);
        fetchData();
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin-token');
    router.push('/admin');
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <div className="flex gap-3">
          <a
            href="/admin/extract"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            자막 추출
          </a>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={() => { setEditingItem(null); setShowForm(true); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 새 기술 추가
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {editingItem ? '기술 항목 수정' : '새 기술 항목 추가'}
          </h2>
          <TechForm
            categories={categories}
            initialData={editingItem ? {
              name: editingItem.name,
              description: editingItem.description,
              categoryId: editingItem.category?.id || 0,
              introducedAt: editingItem.introducedAt,
              sourceVideoUrls: editingItem.sourceVideos.map((v) => v.url),
            } : undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
          />
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">등록된 기술 항목이 없습니다</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">카테고리</th>
                <th className="px-4 py-3">소개일</th>
                <th className="px-4 py-3">출처</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">{item.category?.name || '-'}</td>
                  <td className="px-4 py-3">{item.introducedAt}</td>
                  <td className="px-4 py-3">{item.sourceVideos.length}개</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { setEditingItem(item); setShowForm(true); }}
                      className="mr-2 text-blue-600 hover:underline"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:underline"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
