import DocumentsDashboard from "@/components/DocumentsDashboard";

export default function Page() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <DocumentsDashboard />
      </div>
    </div>
  );
}
