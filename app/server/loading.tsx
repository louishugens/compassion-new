export default function Loading() {
  return (
    <main className="p-8 flex flex-col gap-4 mx-auto max-w-2xl">
      <h1 className="text-4xl font-bold text-center">Convex + Next.js</h1>
      <div className="flex flex-col gap-4 bg-slate-200 dark:bg-slate-800 p-4 rounded-md animate-pulse">
        <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-3/4"></div>
        <div className="h-32 bg-slate-300 dark:bg-slate-700 rounded"></div>
      </div>
    </main>
  );
}

