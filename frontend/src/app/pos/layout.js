import POSSidebar from "@/components/pos/POSSidebar";

export default function POSLayout({ children }) {
  return (
    <div className="flex h-screen bg-beige-100">
      <POSSidebar />
      <main className="flex-1 overflow-y-auto bg-beige-100 p-8">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
