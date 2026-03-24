import { usePuterStore } from '~/lib/puter';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

export const meta = () => [
  { title: 'Resumind | Auth' },
  { name: 'description', content: 'Log into your account' },
];

const Auth = () => {
  const { isLoading, auth } = usePuterStore();
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ safer next handling
  const next = new URLSearchParams(location.search).get('next') || '/';

  // ✅ redirect after login
  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate(next);
    }
  }, [auth.isAuthenticated, next, navigate]);

  return (
    <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center">
      <div className="gradient-border shadow-lg">
        <section className="flex flex-col gap-8 bg-white rounded-2xl p-10 w-[350px]">
          {/* Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Welcome</h1>
            <h2 className="text-gray-500">
              Log In to Continue Your Job Journey
            </h2>
          </div>

          {/* Button */}
          <div className="flex justify-center">
            {isLoading ? (
              <button className="auth-button animate-pulse w-full">
                <p>Signing you in...</p>
              </button>
            ) : auth.isAuthenticated ? (
              <button className="auth-button w-full" onClick={auth.signOut}>
                <p>Log Out</p>
              </button>
            ) : (
              <button className="auth-button w-full" onClick={auth.signIn}>
                <p>Log In</p>
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Auth;
