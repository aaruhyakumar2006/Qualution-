import React, { useState, useEffect, useRef } from 'react';
import './Splitter.css';

interface SplitterProps {
  direction?: 'horizontal' | 'vertical';
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  firstPane: React.ReactNode;
  secondPane: React.ReactNode;
  className?: string;
  splitterTestId?: string;
}

export const Splitter: React.FC<SplitterProps> = ({
  direction = 'horizontal',
  initialSize = 240,
  minSize = 140,
  maxSize = 600,
  firstPane,
  secondPane,
  className = '',
  splitterTestId = 'win-splitter',
}) => {
  const [size, setSize] = useState<number>(initialSize);
  const isDraggingRef = useRef<boolean>(false);
  const startPosRef = useRef<number>(0);
  const startSizeRef = useRef<number>(initialSize);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startSizeRef.current = size;
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;
      const newSize = Math.max(minSize, Math.min(maxSize, startSizeRef.current + delta));
      setSize(newSize);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [direction, minSize, maxSize]);

  return (
    <div
      ref={containerRef}
      className={`win-splitter-container ${direction} ${className}`}
      data-testid="splitter-container"
    >
      <div
        className="win-splitter-first"
        style={direction === 'horizontal' ? { width: `${size}px` } : { height: `${size}px` }}
      >
        {firstPane}
      </div>

      <div
        className={`win-splitter-bar ${direction}`}
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation={direction}
        data-testid={splitterTestId}
      >
        <div className="win-splitter-handle" />
      </div>

      <div className="win-splitter-second">
        {secondPane}
      </div>
    </div>
  );
};
