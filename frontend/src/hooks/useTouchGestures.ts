import { useEffect, useRef, useState, useCallback } from 'react';

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

interface TouchGesture {
  type: 'swipe' | 'tap' | 'pinch' | 'longPress' | 'doubleTap';
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
  scale?: number;
  duration: number;
  timestamp: number;
}

interface TouchGestureConfig {
  swipeThreshold?: number;
  tapThreshold?: number;
  longPressThreshold?: number;
  doubleTapThreshold?: number;
  pinchThreshold?: number;
  maxTouchPoints?: number;
}

interface UseTouchGesturesReturn {
  onTouchStart: (event: React.TouchEvent<HTMLElement>) => void;
  onTouchMove: (event: React.TouchEvent<HTMLElement>) => void;
  onTouchEnd: (event: React.TouchEvent<HTMLElement>) => void;
  gestures: TouchGesture[];
  isGesturing: boolean;
}

const useTouchGestures = (
  elementRef: React.RefObject<HTMLElement>,
  config: TouchGestureConfig = {},
  onGesture?: (gesture: TouchGesture) => void
): UseTouchGesturesReturn => {
  const [gestures, setGestures] = useState<TouchGesture[]>([]);
  const [isGesturing, setIsGesturing] = useState(false);

  const {
    swipeThreshold = 50,
    tapThreshold = 10,
    longPressThreshold = 500,
    doubleTapThreshold = 300,
    pinchThreshold = 20,
    maxTouchPoints = 2,
  } = config;

  const touchPoints = useRef<TouchPoint[]>([]);
  const lastTap = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const initialDistance = useRef<number>(0);
  const initialScale = useRef<number>(1);

  const getDistance = (
    touch1: React.Touch | Touch,
    touch2: React.Touch | Touch
  ): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngleFromPoints = (
    startPoint: TouchPoint,
    endPoint: TouchPoint
  ): number => {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      if (!elementRef.current || !elementRef.current.contains(event.target as Node)) {
        return;
      }

      const touches = event.touches;
      const currentTime = Date.now();

      if (touches.length > maxTouchPoints) {
        return;
      }

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }

      touchPoints.current = Array.from(touches).map((touch) => ({
        x: touch.clientX,
        y: touch.clientY,
        time: currentTime,
      }));

      setIsGesturing(true);

      if (touches.length === 1) {
        longPressTimer.current = setTimeout(() => {
          const gesture: TouchGesture = {
            type: 'longPress',
            duration: longPressThreshold,
            distance: 0,
            timestamp: Date.now(),
          };

          setGestures((previousGestures) => [...previousGestures, gesture]);
          onGesture?.(gesture);
          setIsGesturing(false);
        }, longPressThreshold);
      } else if (touches.length === 2) {
        initialDistance.current = getDistance(touches[0], touches[1]);
        initialScale.current = 1;
      }
    },
    [elementRef, longPressThreshold, maxTouchPoints, onGesture]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      if (!elementRef.current || !isGesturing) {
        return;
      }

      const touches = event.touches;
      const currentTime = Date.now();

      if (longPressTimer.current && touches.length === 1) {
        const firstTouch = touches[0];
        const firstPoint = touchPoints.current[0];

        if (firstPoint) {
          const distance = Math.sqrt(
            Math.pow(firstTouch.clientX - firstPoint.x, 2) +
              Math.pow(firstTouch.clientY - firstPoint.y, 2)
          );

          if (distance > tapThreshold) {
            clearTimeout(longPressTimer.current);
          }
        }
      }

      if (touches.length === 2 && initialDistance.current > 0) {
        const currentDistance = getDistance(touches[0], touches[1]);
        const scale = currentDistance / initialDistance.current;

        if (Math.abs(1 - scale) > pinchThreshold / 100) {
          const gesture: TouchGesture = {
            type: 'pinch',
            scale,
            duration: currentTime - (touchPoints.current[0]?.time || currentTime),
            timestamp: currentTime,
          };

          setGestures((previousGestures) => [...previousGestures, gesture]);
          onGesture?.(gesture);
        }
      }

      touchPoints.current = Array.from(touches).map((touch) => ({
        x: touch.clientX,
        y: touch.clientY,
        time: currentTime,
      }));
    },
    [elementRef, isGesturing, onGesture, pinchThreshold, tapThreshold]
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      if (!elementRef.current) {
        return;
      }

      const touches = event.changedTouches;
      const currentTime = Date.now();

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }

      if (touchPoints.current.length === 1 && touches.length === 1) {
        const startPoint = touchPoints.current[0];
        const endPoint: TouchPoint = {
          x: touches[0].clientX,
          y: touches[0].clientY,
          time: currentTime,
        };

        if (startPoint) {
          const duration = currentTime - startPoint.time;
          const distance = Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) +
              Math.pow(endPoint.y - startPoint.y, 2)
          );

          if (distance < tapThreshold && duration < 200) {
            const timeSinceLastTap = currentTime - lastTap.current;

            if (timeSinceLastTap < doubleTapThreshold) {
              const gesture: TouchGesture = {
                type: 'doubleTap',
                duration: timeSinceLastTap,
                distance: 0,
                timestamp: currentTime,
              };

              setGestures((previousGestures) => [...previousGestures, gesture]);
              onGesture?.(gesture);
              lastTap.current = 0;
            } else {
              const gesture: TouchGesture = {
                type: 'tap',
                duration,
                distance: 0,
                timestamp: currentTime,
              };

              setGestures((previousGestures) => [...previousGestures, gesture]);
              onGesture?.(gesture);
              lastTap.current = currentTime;
            }
          } else if (distance > swipeThreshold && duration < 500) {
            const angle = getAngleFromPoints(startPoint, endPoint);

            let direction: 'left' | 'right' | 'up' | 'down';

            if (angle >= -45 && angle < 45) {
              direction = 'right';
            } else if (angle >= 45 && angle < 135) {
              direction = 'down';
            } else if (angle >= 135 || angle < -135) {
              direction = 'left';
            } else {
              direction = 'up';
            }

            const gesture: TouchGesture = {
              type: 'swipe',
              direction,
              distance,
              duration,
              timestamp: currentTime,
            };

            setGestures((previousGestures) => [...previousGestures, gesture]);
            onGesture?.(gesture);
          }
        }
      }

      touchPoints.current = [];
      setIsGesturing(false);
    },
    [doubleTapThreshold, elementRef, onGesture, swipeThreshold, tapThreshold]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setGestures((previousGestures) =>
        previousGestures.filter(
          (gesture) => Date.now() - gesture.timestamp < 5000
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    gestures,
    isGesturing,
  };
};

export default useTouchGestures;
