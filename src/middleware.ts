// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export const onRequest = clerkMiddleware((auth, context, next) => {
  if (isAdminRoute(context.request)) {
    const authObj = auth();
    if (!authObj.userId) {
      return authObj.redirectToSignIn();
    }
  }
  return next();
});
