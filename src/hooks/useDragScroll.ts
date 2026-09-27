'use client';

import { useRef, useState, useEffect } from 'react';

export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<T>) => {
    if (!ref.current) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.clientX);
    setScrollLeft(ref.current.scrollLeft);
    ref.current.style.scrollBehavior = 'auto';
  };

  const handleTouchStart = (e: React.TouchEvent<T>) => {
    if (!ref.current) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.touches[0].clientX);
    setScrollLeft(ref.current.scrollLeft);
    ref.current.style.scrollBehavior = 'auto';
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !ref.current) return;
      const walk = (e.clientX - startX) * 2.2;
      if (Math.abs(walk) > 5) {
        setHasDragged(true);
      }
      ref.current.scrollLeft = scrollLeft - walk;
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isDragging || !ref.current) return;
      const walk = (e.touches[0].clientX - startX) * 2.2;
      if (Math.abs(walk) > 5) {
        setHasDragged(true);
      }
      ref.current.scrollLeft = scrollLeft - walk;
    };

    const handleGlobalUp = () => {
      if (ref.current) {
        ref.current.style.scrollBehavior = '';
      }
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalUp);
      window.addEventListener('touchmove', handleGlobalTouchMove);
      window.addEventListener('touchend', handleGlobalUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [isDragging, startX, scrollLeft]);

  return {
    ref,
    isDragging,
    hasDragged,
    events: {
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
      onDragStart: (e: React.DragEvent) => e.preventDefault(),
    },
  };
}
