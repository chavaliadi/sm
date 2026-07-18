import React from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export function LoginPage() {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in with your ministry credentials to access appraisal records."
    >
      <LoginForm />
    </AuthLayout>
  );
}
export default LoginPage;
