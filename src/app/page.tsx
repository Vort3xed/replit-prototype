// src/app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-8">Welcome to the Java Compiler & Runner</h1>
      <p className="text-xl mb-4">
        Click the button below to start coding!
      </p>
      <Link href="/editor">
        <button className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600">
          Go to Editor
        </button>
      </Link>
    </div>
  );
}