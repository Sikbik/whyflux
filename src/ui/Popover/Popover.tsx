import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { type Placement, useFloating } from '../Floating/useFloating';
import styles from './Popover.module.css';

export interface PopoverProps {
  /** The trigger's content (a label, an icon). The trigger is a button the Popover renders. */
  trigger: ReactNode;
  /** Accessible name of the trigger button when `trigger` is only an icon. */
  label?: string;
  /** The panel content: anything, including links. */
  children: ReactNode;
  placement?: Placement;
  /** Class for the trigger button. */
  className?: string;
  /** Class for the panel. */
  panelClassName?: string;
}

/**
 * A click-to-open disclosure panel in a portal: closes on Escape, on an outside click and when
 * focus leaves. Use it for things that need links or more than a sentence (a source list, a cell's
 * detail). The trigger is a real button with `aria-expanded`.
 */
export function Popover({ trigger, label, children, placement = 'bottom', className, panelClassName }: PopoverProps) {
  const id = useId();
  const btn = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const pos = useFloating(btn, panel, open, placement, 8);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) btn.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true);
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || btn.current?.contains(t)) return;
      close(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        className={cn(styles.trigger, className)}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </button>
      {open
        ? createPortal(
            <div
              ref={panel}
              id={id}
              role="dialog"
              aria-label={label}
              className={cn(styles.panel, panelClassName)}
              style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
