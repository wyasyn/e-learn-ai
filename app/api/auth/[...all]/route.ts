import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Create handlers asynchronously
const createHandlers = async () => {
  const handler = await auth.handler;
  return toNextJsHandler(handler);
};

const handlerPromise = createHandlers();

export const GET = async (request: Request) => {
  const { GET: handler } = await handlerPromise;
  return handler(request);
};

export const POST = async (request: Request) => {
  const { POST: handler } = await handlerPromise;
  return handler(request);
};
