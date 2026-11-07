import { Suspense } from "react";
import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create Account",
};

export default function RegisterPage() {
  return (
    <main id="main-content" className="flex-1 flex items-center justify-center p-4 py-12">
      <Suspense fallback={<div className="text-center p-8">Loading registration...</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
