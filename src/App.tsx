import { useEffect } from "react";
import { firebaseAnalytics } from "./firebase";

export default function App() {
  useEffect(() => {
    console.log("Firebase initialized:", firebaseAnalytics.app.name);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">M Group Cool</h1>
        <p className="mt-2 text-slate-300">Firebase has been initialized successfully.</p>
      </div>
    </main>
  );
}
