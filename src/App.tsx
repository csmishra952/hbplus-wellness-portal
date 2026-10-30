import React from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './screens/LandingPage';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';

const AppRouter: React.FC = () => {
  const { profile, route, isLoading } = useAuth();

  if (isLoading && route === '/dashboard') {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-[#0A0C10] text-white flex flex-col items-center justify-center gap-3 px-4">
        <Loader2 className="h-7 w-7 animate-spin text-[#CCFF00]" aria-hidden="true" />
        <p className="text-xs font-medium text-[#94A3B8] text-center">
          Initializing HB+ secure workspace...
        </p>
      </div>
    );
  }

  if (route === '/') {
    return (
      <div className="w-full overflow-x-hidden">
        <LandingPage />
      </div>
    );
  }

  if (route === '/login') {
    return (
      <div className="w-full overflow-x-hidden">
        <LoginScreen />
      </div>
    );
  }

  // Strict route protection: unauthenticated users attempting /dashboard redirect to /login
  if (!profile) {
    return (
      <div className="w-full overflow-x-hidden">
        <LoginScreen />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden">
      <DashboardScreen />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
