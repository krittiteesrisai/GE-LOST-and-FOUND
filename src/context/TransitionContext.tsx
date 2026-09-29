import { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

type Direction = 'left' | 'right' | 'none';

interface TransitionContextType {
  direction: Direction;
}

const TransitionContext = createContext<TransitionContextType>({ direction: 'none' });

export const useTransitionDirection = () => useContext(TransitionContext);

// Tab hierarchy to determine sliding direction
const ROUTE_RANK: Record<string, number> = {
  '/': 0,
  '/list': 1,
  '/my-posts': 2,
  '/report': 3,
  '/report/lost': 3,
  '/report/found': 3,
  '/help': 4,
  '/login': 5,
  '/admin': 6,
};

export function TransitionProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const [direction, setDirection] = useState<Direction>('none');

  useEffect(() => {
    const prev = prevPathRef.current;
    const current = location.pathname;

    if (prev !== current) {
      const prevRank = ROUTE_RANK[prev] ?? 2;
      const currentRank = ROUTE_RANK[current] ?? 2;

      if (currentRank > prevRank) {
        setDirection('left'); // moving forward (slides in from right to left)
      } else if (currentRank < prevRank) {
        setDirection('right'); // moving backward (slides in from left to right)
      } else {
        setDirection('left');
      }

      prevPathRef.current = current;
    }
  }, [location.pathname]);

  return (
    <TransitionContext.Provider value={{ direction }}>
      {children}
    </TransitionContext.Provider>
  );
}
