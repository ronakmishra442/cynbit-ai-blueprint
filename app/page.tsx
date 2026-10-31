import BlueprintForm from "@/components/BlueprintForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <h1 className="mx-auto mb-8 max-w-2xl text-3xl font-bold text-slate-900">
        Start your project with a tailored blueprint
      </h1>
      <BlueprintForm />
    </main>
  );
}