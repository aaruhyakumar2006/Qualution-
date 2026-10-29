import React, { Suspense, useEffect } from 'react';
import './teacher-portal/portal-global.css';
import './teacher-portal/styles/portal.css';
import './teacher-portal/styles/telemetry.css';
import './teacher-portal/App.css';
// @ts-ignore
import PortalApp from './teacher-portal/PortalApp';

export interface TeacherPortalPageProps {
  onNavigateHome: () => void;
  onNavigateStudentPortal?: () => void;
  onNavigateCollab?: () => void;
  onLaunchIDE?: () => void;
  onNavigateLearn?: () => void;
}

export const TeacherPortalPage: React.FC<TeacherPortalPageProps> = ({
  onLaunchIDE,
}) => {
  // ── Unlock scrolling while the teacher portal is mounted ──
  useEffect(() => {
    const body = document.body;
    const root = document.getElementById('root');

    body.classList.add('teacher-portal-active');
    const prevBodyOverflow = body.style.overflow;
    const prevBodyHeight = body.style.height;
    const prevRootOverflow = root?.style.overflow ?? '';
    const prevRootHeight = root?.style.height ?? '';

    body.style.overflow = 'auto';
    body.style.height = 'auto';
    if (root) {
      root.style.overflow = 'auto';
      root.style.height = 'auto';
    }

    return () => {
      body.classList.remove('teacher-portal-active');
      body.style.overflow = prevBodyOverflow;
      body.style.height = prevBodyHeight;
      if (root) {
        root.style.overflow = prevRootOverflow;
        root.style.height = prevRootHeight;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#FFF9F3' }}>
      {/* ── The full teacher portal application ── */}
      {/* onLaunchIDE is passed down so clicking Workbench opens the real Qualution IDE */}
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.2rem', background: '#FFF9F3', color: '#1F1F1F' }}>
          Loading Qualution Teacher Portal…
        </div>
      }>
        <PortalApp onLaunchIDE={onLaunchIDE} />
      </Suspense>
    </div>
  );
};

export default TeacherPortalPage;
