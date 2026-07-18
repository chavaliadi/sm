import React from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegistrationForm } from "@/components/auth/RegistrationForm";

export function RegisterPage() {
  return (
    <AuthLayout
      title="Request Account Access"
      subtitle="Register your organization profile for appraisal credentials."
    >
      <RegistrationForm />
    </AuthLayout>
  );
}
export default RegisterPage;
