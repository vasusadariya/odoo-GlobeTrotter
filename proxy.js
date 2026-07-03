import authMiddleware from 'next-auth/middleware';

export default function proxy(...args) {
  return authMiddleware(...args);
}

export const config = {
  matcher: ['/dashboard/:path*', '/trips/:path*', '/profile/:path*']
};