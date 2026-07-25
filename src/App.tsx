import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Auth from './components/auth/Auth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Home } from './features/home/Home';
import { Dashboard } from './features/dashboard/Dashboard';
import { GroupSetup } from './features/group/GroupSetup';
import { Friends } from './features/friends/Friends';
import { Journey } from './features/journey/Journey';
import { Progress } from './features/progress/Progress';
import { Achievements } from './features/progress/Achievements';
import { Layout } from './components/layout/Layout';
import { PageTransition } from './components/layout/PageTransition';
import { NotificationsModal } from './features/notifications/NotificationsModal';

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen text-white bg-black relative">
      <NotificationsModal />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          
          {/* Authentication Route */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected Routes */}
          <Route 
            path="/group-setup" 
            element={
              <ProtectedRoute>
                <PageTransition><GroupSetup /></PageTransition>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
            <Route path="/friends" element={<PageTransition><Friends /></PageTransition>} />
            <Route path="/progress" element={<PageTransition><Progress /></PageTransition>} />
            <Route path="/journey" element={<PageTransition><Journey /></PageTransition>} />
            <Route path="/achievements" element={<PageTransition><Achievements /></PageTransition>} />
          </Route>
          
          {/* Catch All */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;
