import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <main id="main-content" className="flex-1 flex items-center justify-center p-4 py-12">
      <Suspense fallback={<div className="text-center p-8">Loading sign-in...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
