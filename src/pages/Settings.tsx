
import { Sidebar } from "@/components/Sidebar";

export default function Settings() {
  return (
    <div className="flex min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      <Sidebar />
      <main className="flex-1 ml-16 md:ml-64">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          <div className="rounded-lg border bg-card p-6">
            <p className="text-muted-foreground">Settings page coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
