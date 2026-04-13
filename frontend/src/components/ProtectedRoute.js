import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#0EA5E9] border-t-transparent animate-spin" />
          <p className="text-sm text-[#9CA3AF] font-body">Loading...</p>
        </div>
      </div>
    );
  }

  if (user === false) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
