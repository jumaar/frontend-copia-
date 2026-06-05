import { useEffect } from 'react';

export const useClickOutside = (
  handler: () => void,
  excludeSelector?: string
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (excludeSelector && (event.target as Element).closest(excludeSelector)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handler, excludeSelector]);
};
