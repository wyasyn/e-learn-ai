import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/lib/db";
import { nextCookies } from "better-auth/next-js";

// Create a function to initialize auth with the database connection
async function createAuth() {
  const client = await connectToDatabase();
  const db = client.db("study-buddy");

  return betterAuth({
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
    database: mongodbAdapter(db),
    plugins: [nextCookies()],
  });
}

// Export the auth instance
export const auth = await createAuth();
