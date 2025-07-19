/* eslint-disable @typescript-eslint/no-explicit-any */
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/lib/db";
import { nextCookies } from "better-auth/next-js";

// Initialize the auth configuration without database connection first
const createAuthConfig = () => ({
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()],
});

// Create a singleton auth instance
let authInstance: any = null;

const getAuthInstance = async () => {
  if (!authInstance) {
    const client = await connectToDatabase();
    const db = client.db("study-buddy");

    authInstance = betterAuth({
      ...createAuthConfig(),
      database: mongodbAdapter(db),
    });
  }
  return authInstance;
};

// Create auth instance immediately with promise
const authPromise = getAuthInstance();

// Export the auth object
export const auth = {
  handler: authPromise.then((instance) => instance.handler),
  api: {
    getSession: async (options: any) => {
      const instance = await authPromise;
      return instance.api.getSession(options);
    },
    signInEmail: async (options: any) => {
      const instance = await authPromise;
      return instance.api.signInEmail(options);
    },
    signUpEmail: async (options: any) => {
      const instance = await authPromise;
      return instance.api.signUpEmail(options);
    },
  },
};
