import ForgotPasswordForm from "@/app/forgotPassword/ForgotPasswordForm";

export default function UserForgotPassword() {
  return (
    <ForgotPasswordForm
      backHref="/user/user-profile"
      doneHref="/user/user-profile"
    />
  );
}
