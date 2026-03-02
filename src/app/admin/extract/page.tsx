'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ExtractForm from '@/components/admin/extract-form';
import ExtractResults from '@/components/admin/extract-results';

interface Category {
  id: number;
  name: string;
}

interface VideoResult {
  videoUrl: string;
  videoTitle: string;
  extractedItems: Array<{
    name: string;
    description: string;
    url: string;
    suggestedCategory: string;
  }>;
  error?: string;
}

interface SyncResult {
  newVideos: Array<{ title: string; url: string }>;
  newCount: number;
  existingCount: number;
  totalFound: number;
  message: string;
}

interface AnalyzeVideoResult {
  videoUrl: string;
  videoTitle: string;
  techCount: number;
  error?: string;
}

interface AnalyzeResult {
  results: AnalyzeVideoResult[];
  summary: {
    totalVideos: number;
    successCount: number;
    failCount: number;
    totalTechItems: number;
  };
  message: string;
}

export default function ExtractPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [results, setResults] = useState<VideoResult[] | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  // Channel sync/analyze state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);

  const getToken = useCallback(() => {
    const token = sessionStorage.getItem('admin-token');
    if (!token) {
      router.push('/admin');
      return null;
    }
    return token;
  }, [router]);

  useEffect(() => {
    getToken();
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, [getToken]);

  const handleSync = async () => {
    const token = getToken();
    if (!token) return;
    setSyncing(true);
    setError('');
    setSyncResult(null);

    try {
      const res = await fetch('/api/admin/channel/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '동기화 실패');
      }

      const data: SyncResult = await res.json();
      setSyncResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '동기화 중 오류 발생');
    } finally {
      setSyncing(false);
    }
  };

  const handleBatchAnalyze = async () => {
    const token = getToken();
    if (!token) return;
    setAnalyzing(true);
    setError('');
    setAnalyzeResult(null);

    try {
      const res = await fetch('/api/admin/channel/analyze', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '분석 실패');
      }

      const data: AnalyzeResult = await res.json();
      setAnalyzeResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류 발생');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExtract = async (urls: string[]) => {
    const token = getToken();
    if (!token) return;
    setExtracting(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/admin/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoUrls: urls }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '추출 요청 실패');
      }

      const data = await res.json();
      setJobId(data.jobId);

      // Poll for results
      const pollJob = async (id: number): Promise<void> => {
        const jobRes = await fetch(`/api/admin/extract/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!jobRes.ok) throw new Error('작업 조회 실패');
        const job = await jobRes.json();

        if (job.status === 'completed') {
          setResults(job.results || []);
        } else if (job.status === 'failed') {
          throw new Error(job.errorMessage || '추출 실패');
        } else {
          await new Promise((r) => setTimeout(r, 2000));
          return pollJob(id);
        }
      };

      await pollJob(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '추출 중 오류 발생');
    } finally {
      setExtracting(false);
    }
  };

  const handleConfirm = async (items: Array<{
    name: string;
    description: string;
    url: string;
    categoryId: number;
    introducedAt: string;
    sourceVideoUrl: string;
  }>) => {
    const token = getToken();
    if (!token || !jobId) return;
    setConfirming(true);

    try {
      const res = await fetch(`/api/admin/extract/${jobId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) throw new Error('확정 실패');
      setResults(null);
      setJobId(null);
      alert('기술 항목이 성공적으로 추가되었습니다!');
    } catch (err) {
      setError(err instanceof Error ? err.message : '확정 중 오류 발생');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">자막 기반 기술 추출</h1>
        <a
          href="/admin/dashboard"
          className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
          대시보드로 돌아가기
        </a>
      </div>

      {/* Channel Sync & Batch Analyze Section */}
      <section className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-5">
        <h2 className="mb-3 text-lg font-semibold text-blue-900">
          조코딩 AI뉴스 자동 파이프라인
        </h2>
        <p className="mb-4 text-sm text-blue-700">
          조코딩 채널에서 AI뉴스 영상을 자동 수집하고 일괄 분석합니다.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSync}
            disabled={syncing || analyzing}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncing ? '동기화 중...' : '1. AI뉴스 영상 동기화'}
          </button>
          <button
            onClick={handleBatchAnalyze}
            disabled={syncing || analyzing}
            className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? '분석 중...' : '2. 미분석 영상 일괄 분석'}
          </button>
        </div>

        {/* Sync Result */}
        {syncResult && (
          <div className="mt-4 rounded-lg border border-blue-300 bg-white p-4">
            <p className="mb-2 font-medium text-blue-900">{syncResult.message}</p>
            <p className="text-sm text-gray-600">
              발견: {syncResult.totalFound}개 / 신규: {syncResult.newCount}개 / 기존: {syncResult.existingCount}개
            </p>
            {syncResult.newVideos && syncResult.newVideos.length > 0 && (
              <ul className="mt-2 space-y-1">
                {syncResult.newVideos.map((v) => (
                  <li key={v.url} className="text-sm text-gray-700">
                    + {v.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Analyze Result */}
        {analyzeResult && (
          <div className="mt-4 rounded-lg border border-green-300 bg-white p-4">
            <p className="mb-2 font-medium text-green-900">{analyzeResult.message}</p>
            <p className="text-sm text-gray-600">
              성공: {analyzeResult.summary.successCount}개 /
              실패: {analyzeResult.summary.failCount}개 /
              추출된 기술: {analyzeResult.summary.totalTechItems}개
            </p>
            {analyzeResult.results.length > 0 && (
              <ul className="mt-2 space-y-1">
                {analyzeResult.results.map((r) => (
                  <li key={r.videoUrl} className="text-sm">
                    <span className={r.error ? 'text-red-600' : 'text-gray-700'}>
                      {r.videoTitle}: {r.error ? `오류 - ${r.error}` : `${r.techCount}개 기술 추출`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-300" />
        <span className="text-sm text-gray-500">또는 수동으로 URL 입력</span>
        <div className="h-px flex-1 bg-gray-300" />
      </div>

      <ExtractForm onSubmit={handleExtract} loading={extracting} />

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {results && (
        <div className="mt-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">추출 결과 검토</h2>
          <ExtractResults
            results={results}
            categories={categories}
            onConfirm={handleConfirm}
            confirming={confirming}
          />
        </div>
      )}
    </main>
  );
}
