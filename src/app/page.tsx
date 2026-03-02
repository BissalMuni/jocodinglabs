import TechList from '@/components/tech-list';
import StatsBar from '@/components/stats-bar';

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              AI Tech Tracker
            </h1>
            <p className="text-sm text-gray-500">
              조코딩 AI 뉴스에서 소개된 최신 AI 기술 목록
            </p>
          </div>
        </div>
        <StatsBar />
      </div>
      <TechList />
      <footer className="mt-12 border-t border-gray-200 pt-6 pb-8 text-center text-xs text-gray-400">
        <p>조코딩 AI 뉴스 영상을 기반으로 자동 수집·분석된 기술 목록입니다.</p>
        <p className="mt-1">
          Powered by Claude AI · Built with Next.js
        </p>
      </footer>
    </main>
  );
}
