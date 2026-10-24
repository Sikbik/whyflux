import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Toast.module.css';

type ToastTone = 'info' | 'ok' | 'warn' | 'crit';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastApi {
  /** Shows one line for about 2.6 s in a polite live region. */
  toast: (message: string, tone?: ToastTone) => void;
}

const Ctx = createContext<ToastApi>({ toast: () => {} });

/** `const { toast } = useToast(); toast('Link copied')`. A no-op outside the provider. */
export function useToast(): ToastApi {
  return useContext(Ctx);
}

/** Mount once in App. Renders the live region and the stack. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = next.current++;
    setItems((list) => [...list.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 2600);
  }, []);

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {createPortal(
        <div className={styles.region} role="status" aria-live="polite">
          {items.map((t) => (
            <div key={t.id} className={styles.toast} data-tone={t.tone === 'info' ? undefined : t.tone}>
              {t.message}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  );
}
