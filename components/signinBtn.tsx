"use client";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";

export default function SigninBtn() {
  const handleSignIn = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  return <Button onClick={handleSignIn}>Signin</Button>;
}
