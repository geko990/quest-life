import { useState, useRef } from 'react';

/**
 * Custom hook to enable longpress touch & mouse drag-and-drop reordering for lists.
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

  const handleTouchStart = (item, index, e) => {
    // Only drag with primary touch or primary mouse click
    if (e.button && e.button !== 0) return;
    const touch = e.touches ? e.touches[0] : e;
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    isDraggingRef.current = false;

    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    // 300ms longpress threshold
    pressTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      setDraggingId(item.id);
      if (navigator.vibrate) {
        try { navigator.vibrate(40); } catch (err) {}
      }
    }, 300);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    const diffX = Math.abs(touch.clientX - startPosRef.current.x);
    const diffY = Math.abs(touch.clientY - startPosRef.current.y);

    // If finger moves more than 8px before 300ms, user is scrolling normally -> cancel longpress
    if (!isDraggingRef.current) {
      if (diffX > 8 || diffY > 8) {
        if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      }
      return;
    }

    // Active drag: prevent default page scrolling & live swap items
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
        boxShadow: draggingId === item.id ? '0 12px 28px rgba(124, 58, 237, 0.4)' : undefined,
        border: draggingId === item.id ? '2px solid var(--accent-primary)' : undefined,
        opacity: draggingId === item.id ? 0.92 : 1,
        zIndex: draggingId === item.id ? 50 : 1,
        transition: draggingId === item.id ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: 'grab'
      }
    })
  };
}
