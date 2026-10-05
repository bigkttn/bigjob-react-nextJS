import ForgotPasswordForm from "@/app/forgotPassword/ForgotPasswordForm";

export default function CompanyForgotPassword() {
  return (
    <ForgotPasswordForm
      backHref="/company/profile"
      doneHref="/company/profile"
    />
  );
}
