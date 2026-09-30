import React, { useState } from 'react';
import ToonhubHero from '../components/ToonhubHero';
import { LoginModal } from '../features/auth/LoginModal';
import { SignUpModal } from '../features/auth/SignUpModal';

export interface LandingPageProps {
  onLaunchIDE: () => void;
  onOpenLogin?: () => void;
  onOpenSignUp?: () => void;
  onNavigateLearn?: () => void;
  onNavigateTeacherPortal?: () => void;
  onNavigateStudentPortal?: () => void;
  onNavigateCollab?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchIDE,
  onOpenLogin,
  onOpenSignUp,
  onNavigateLearn,
  onNavigateTeacherPortal,
  onNavigateStudentPortal,
  onNavigateCollab,
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  const handleOpenLogin = () => {
    if (onOpenLogin) {
      onOpenLogin();
    } else {
      setShowLoginModal(true);
    }
  };

  const handleOpenSignUp = () => {
    if (onOpenSignUp) {
      onOpenSignUp();
    } else {
      setShowSignUpModal(true);
    }
  };

  const handleAuthSuccess = (role?: 'student' | 'teacher') => {
    if (role === 'teacher' && onNavigateTeacherPortal) {
      onNavigateTeacherPortal();
    } else if (onNavigateStudentPortal) {
      onNavigateStudentPortal();
    } else {
      onLaunchIDE();
    }
  };

  return (
    <main className="w-full h-screen overflow-hidden">
      <ToonhubHero
        onLaunchIDE={onLaunchIDE}
        onOpenLogin={handleOpenLogin}
        onOpenSignUp={handleOpenSignUp}
        onNavigateLearn={onNavigateLearn || onLaunchIDE}
        onNavigateTeacherPortal={onNavigateTeacherPortal}
        onNavigateStudentPortal={onNavigateStudentPortal}
        onNavigateCollab={onNavigateCollab}
      />
      {!onOpenLogin && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSwitchToSignUp={() => {
            setShowLoginModal(false);
            setShowSignUpModal(true);
          }}
          onSuccess={handleAuthSuccess}
        />
      )}
      {!onOpenSignUp && (
        <SignUpModal
          isOpen={showSignUpModal}
          onClose={() => setShowSignUpModal(false)}
          onSwitchToLogin={() => {
            setShowSignUpModal(false);
            setShowLoginModal(true);
          }}
          onSuccess={handleAuthSuccess}
        />
      )}
    </main>
  );
};

export default LandingPage;
