import TechList from '@/components/tech-list';

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Tech Tracker</h1>
        <p className="mt-2 text-gray-600">
          조코딩 AI 뉴스에서 소개된 AI 기술 목록을 확인하고 실습을 추적하세요
        </p>
      </div>
      <TechList />
    </main>
  );
}
