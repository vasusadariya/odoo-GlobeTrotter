export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/trips/:path*', '/profile/:path*']
};