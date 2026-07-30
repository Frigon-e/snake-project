// src/middleware.ts
import { clerkMiddleware } from '@clerk/astro/server';
import { isAdminRole } from './lib/auth';

export const onRequest = clerkMiddleware(async (auth, context, next) => {
  if (context.url.pathname.startsWith('/admin')) {
    const authObj = auth();
    if (!authObj.userId) {
      return authObj.redirectToSignIn();
    }

    const user = await context.locals.currentUser();
    if (!isAdminRole(user)) {
      return context.redirect('/access-denied');
    }
  }

  return next();
});
