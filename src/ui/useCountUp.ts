import { useEffect, useState } from 'react';

/**
 * A number that counts up from 0 to `target` over `ms`, starting after
 * `delay`. About 20 updates in total, so it's cheap even on slow phones.
 */
export function useCountUp(target: number, ms = 700, delay = 0): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const steps = Math.max(1, Math.min(20, target));
    let step = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      timer = setInterval(() => {
        step += 1;
        setValue(Math.round((target * step) / steps));
        if (step >= steps && timer) clearInterval(timer);
      }, ms / steps);
    }, delay);
    return () => {
      clearTimeout(start);
      if (timer) clearInterval(timer);
    };
  }, [target, ms, delay]);

  return value;
}
