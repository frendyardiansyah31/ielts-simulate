import { CreateTestForm } from "./_components/create-test-form";

export default function NewTestPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Buat Test Baru</h1>
      <CreateTestForm />
    </div>
  );
}
