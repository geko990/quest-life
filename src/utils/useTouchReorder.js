import { useState, useRef, useEffect } from 'react';

/**
 * Custom hook to enable longpress touch & mouse drag-and-drop reordering for lists.
 * Completely locks page/container scrolling during active drag using non-passive touch listeners.
 * 
 * @param {Array} items - The state array to reorder
 * @param {Function} setItems - The state updater function
 * @returns {Object} { draggingId, getDragProps }
 */
export function useTouchReorder(items, setItems) {
  const [draggingId, setDraggingId] = useState(null);
  const pressTimerRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Window non-passive touchmove handler to strictly lock page scroll during active drag
  useEffect(() => {
    const preventTouchScroll = (e) => {
      if (isDraggingRef.current) {
        if (e.cancelable) e.preventDefault();
      }
    };

    if (draggingId) {
      window.addEventListener('touchmove', preventTouchScroll, { passive: false });
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      const mainEl = document.querySelector('.content-area');
      if (mainEl) mainEl.style.overflowY = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      const mainEl = document.querySelector('.content-area');
      if (mainEl) mainEl.style.overflowY = '';
    }

    return () => {
      window.removeEventListener('touchmove', preventTouchScroll);
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      const mainEl = document.querySelector('.content-area');
      if (mainEl) mainEl.style.overflowY = '';
    };
  }, [draggingId]);

  const handleTouchStart = (item, index, e) => {
    if (e.button && e.button !== 0) return;
    const touch = e.touches ? e.touches[0] : e;
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    isDraggingRef.current = false;

    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    // 250ms longpress threshold
    pressTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      setDraggingId(item.id);
      if (navigator.vibrate) {
        try { navigator.vibrate(40); } catch (err) {}
      }
    }, 250);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    const diffX = Math.abs(touch.clientX - startPosRef.current.x);
    const diffY = Math.abs(touch.clientY - startPosRef.current.y);

    // If finger moves more than 6px before longpress fires, user is scrolling normally -> cancel longpress
    if (!isDraggingRef.current) {
      if (diffX > 6 || diffY > 6) {
        if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      }
      return;
    }

    if (e.cancelable) e.preventDefault();

    const elementUnderFinger = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!elementUnderFinger) return;

    const cardElement = elementUnderFinger.closest('[data-reorder-id]');
    if (!cardElement) return;

    const targetId = cardElement.getAttribute('data-reorder-id');
    if (!targetId || targetId === itemsRef.current.find(i => i.id === draggingId)?.id) return;

    const currentList = itemsRef.current;
    const fromIndex = currentList.findIndex(i => i.id === draggingId);
    const toIndex = currentList.findIndex(i => i.id === targetId);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex && setItems) {
      const updated = [...currentList];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      setItems(updated);
    }
  };

  const handleTouchEnd = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    isDraggingRef.current = false;
    setDraggingId(null);
  };

  return {
    draggingId,
    getDragProps: (item, index) => ({
      'data-reorder-id': item.id,
      onTouchStart: (e) => handleTouchStart(item, index, e),
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
      onMouseDown: (e) => handleTouchStart(item, index, e),
      onMouseMove: handleTouchMove,
      onMouseUp: handleTouchEnd,
      style: {
        touchAction: draggingId === item.id ? 'none' : 'pan-y',
        transform: draggingId === item.id ? 'scale(1.03) translateY(-2px)' : 'none',
        boxShadow: draggingId === item.id ? '0 14px 32px rgba(124, 58, 237, 0.45)' : undefined,
        border: draggingId === item.id ? '2px solid var(--accent-primary)' : undefined,
        opacity: draggingId === item.id ? 0.92 : 1,
        zIndex: draggingId === item.id ? 100 : 1,
        transition: draggingId === item.id ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: draggingId === item.id ? 'grabbing' : 'grab'
      }
    })
  };
}
