"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { validateSafeNextPath } from "@/lib/auth/safe-redirect";
import { PASSWORD_RULE_DESCRIPTION, validatePassword, isValidEmail } from "@pathpulse/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function RegisterForm() {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const safeNext = validateSafeNextPath(rawNext, "/profile");

  const { register } = useAuth();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [fieldErrors, setFieldErrors] = React.useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const errorSummaryRef = React.useRef<HTMLDivElement>(null);

  const validateForm = (): boolean => {
    const errors: { name?: string; email?: string; password?: string } = {};

    if (!name.trim() || name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters long.";
    }

    if (!isValidEmail(email)) {
      errors.email = "Please enter a valid email address.";
    }

    const passwordResult = validatePassword(password);
    if (!passwordResult.isValid) {
      errors.password = passwordResult.message || "Invalid password.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const isValid = validateForm();
    if (!isValid) {
      setGeneralError("Please resolve the errors highlighted below.");
      setTimeout(() => {
        errorSummaryRef.current?.focus();
      }, 50);
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      window.location.href = safeNext;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      setGeneralError(msg);
      setTimeout(() => {
        errorSummaryRef.current?.focus();
      }, 50);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Create your account</CardTitle>
        <CardDescription className="text-center">
          Join PathPulse to access barrier-free navigation
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4">
          {generalError && (
            <div ref={errorSummaryRef} tabIndex={-1} className="outline-none">
              <Alert variant="destructive" id="register-error-summary">
                <AlertTitle>Registration failed</AlertTitle>
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="register-name">Full Name</Label>
            <Input
              id="register-name"
              type="text"
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) {
                  setFieldErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              error={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? "register-name-error" : undefined}
            />
            {fieldErrors.name && (
              <p
                id="register-name-error"
                className="text-sm font-semibold text-[var(--destructive)]"
              >
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email">Email Address</Label>
            <Input
              id="register-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              error={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
            />
            {fieldErrors.email && (
              <p
                id="register-email-error"
                className="text-sm font-semibold text-[var(--destructive)]"
              >
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-password">Password</Label>
            <p id="password-rules" className="text-xs text-[var(--muted-foreground)]">
              {PASSWORD_RULE_DESCRIPTION}
            </p>
            <Input
              id="register-password"
              type="password"
              name="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              error={!!fieldErrors.password}
              aria-describedby={
                fieldErrors.password ? "password-rules register-password-error" : "password-rules"
              }
            />
            {fieldErrors.password && (
              <p
                id="register-password-error"
                className="text-sm font-semibold text-[var(--destructive)]"
              >
                {fieldErrors.password}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </Button>

          <p className="text-center text-sm text-[var(--muted-foreground)]">
            Already have an account?{" "}
            <Link
              href={rawNext ? `/login?next=${encodeURIComponent(safeNext)}` : "/login"}
              className="font-semibold text-[var(--primary)] hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
