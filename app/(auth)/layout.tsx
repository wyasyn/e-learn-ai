import { auth } from "@/lib/auth";
import AuthWrapper from "./_components/auth-component";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen">
      {/* Mobile: Only children */}
      <div className="block md:hidden">{children}</div>

      {/* Medium screens and up: Two columns */}
      <AuthWrapper>{children}</AuthWrapper>
    </div>
  );
}
