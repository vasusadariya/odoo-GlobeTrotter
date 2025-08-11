'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) router.push('/auth/login'); // Not authenticated
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-medium p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to GlobeTrotter!
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Hello {session.user.name}, you're successfully logged in.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              🎉 Authentication Feature Complete!
            </h2>
            <p className="text-blue-800">
              This is the protected dashboard area. You can only see this page when authenticated.
              The next features (Dashboard/Home Screen, Create Trip Screen, etc.) will be implemented in the following iterations.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Account</h3>
              <p className="text-gray-600">Email: {session.user.email}</p>
              <p className="text-gray-600">Role: {session.user.role || 'user'}</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Next Steps</h3>
              <p className="text-gray-600">
                Ready to start planning your next adventure? The trip planning features are coming in the next iteration!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}