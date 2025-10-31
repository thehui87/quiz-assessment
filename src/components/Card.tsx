// components/admin/Card.tsx
export function Card({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="mt-1 text-4xl font-extrabold text-gray-900 dark:text-white">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
