import React, { useRef, useState, useEffect } from 'react';
import { Video, Play } from 'lucide-react';
import type { TheoreticalLesson } from '../../features/learning/theoreticalCurriculum';
import './VideoLesson.css';

interface VideoLessonProps {
  video: NonNullable<TheoreticalLesson['video']>;
  lessonTitle: string;
}

export const VideoLesson: React.FC<VideoLessonProps> = ({ video, lessonTitle }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  // Reset playback state when video source changes
  useEffect(() => {
    setHasStarted(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [video.src]);

  const handleStartPlayback = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (video.src.includes('player') || video.src.endsWith('.html')) {
      // Do nothing for iframes, they handle their own play state
      return;
    }

    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined && typeof playPromise.catch === 'function') {
        playPromise.catch((err) => {
          console.warn('Playback initiation prevented:', err);
        });
      }
    }
    setHasStarted(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!hasStarted && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleStartPlayback();
    }
  };

  const accessibleTitle = video.title || lessonTitle;
  const isHtmlPlayer = video.src.includes('player') || video.src.endsWith('.html');

  return (
    <section
      className="theory-visual-lesson-section"
      data-testid="theory-lesson-video"
      aria-labelledby="visual-lesson-heading"
    >
      <div className="theory-visual-lesson-header">
        <div className="theory-visual-lesson-title-area">
          <div className="theory-visual-tag">
            <Video size={14} className="theory-visual-tag-icon" />
            <span>VISUAL LESSON</span>
          </div>
          <h2 id="visual-lesson-heading" className="theory-visual-title">
            {video.title || lessonTitle}
          </h2>
        </div>

        <div className="theory-visual-meta">
          <span className="theory-video-badge">
            {video.durationSeconds === 42 ? '42s DEMO' : video.durationSeconds ? `${Math.round(video.durationSeconds)}s HD` : 'HD LESSON'}
          </span>
          {video.durationSeconds && (
            <span className="theory-video-duration">
              {Math.floor(video.durationSeconds / 60)}:
              {String(video.durationSeconds % 60).padStart(2, '0')}
            </span>
          )}
        </div>
      </div>

      <div
        className={`theory-video-wrapper ${hasStarted || isHtmlPlayer ? 'is-playing' : 'is-idle'}`}
        data-testid="theory-video-container"
        onClick={!hasStarted && !isHtmlPlayer ? handleStartPlayback : undefined}
        onKeyDown={handleKeyDown}
      >
        {isHtmlPlayer ? (
          <iframe
            src={video.src}
            title={video.title || lessonTitle}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            allow="autoplay; fullscreen"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              controls
              playsInline
              preload="none"
              poster={video.poster}
              className="theory-video-element"
              data-testid="theory-video-player"
              onPlay={() => setHasStarted(true)}
              onClick={!hasStarted ? handleStartPlayback : undefined}
            >
              <source src={video.src} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {!hasStarted && (
              <button
                type="button"
                className="theory-video-play-overlay"
                onClick={handleStartPlayback}
                aria-label={`Play visual lesson: ${accessibleTitle}`}
                data-testid="theory-video-play-button"
              >
                <div className="theory-play-btn-circle">
                  <Play size={36} fill="#00f0ff" className="theory-play-icon" />
                </div>
                <div className="theory-play-text-group">
                  <span className="theory-play-label">Watch Visual Lesson</span>
                  <span className="theory-play-subtext">Click anywhere to play • {video.durationSeconds === 42 ? '42s DEMO' : 'HD Video'}</span>
                </div>
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
};
