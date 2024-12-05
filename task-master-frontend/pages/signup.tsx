import Link from "next/link";
import AuthLayout from "./components/auth/AuthLayout";
import { FormLink, SignUpText } from "./components/styles";
import SignupForm from "./components/auth/SignupForm";

const SignUp = () => {
  return (
    <AuthLayout title="Create an account on TaskMaster">
      <SignUpText>
        Already have an account?{" "}
        <Link href="/login" passHref legacyBehavior>
          <FormLink>Sign in</FormLink>
        </Link>
      </SignUpText>
      <div className="space-y-6 ">
        <SignupForm />
      </div>
    </AuthLayout>
  );
};

export default SignUp;
