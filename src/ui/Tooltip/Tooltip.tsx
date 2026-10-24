import {
  cloneElement,
  type FocusEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { mergeRefs } from '../internal/refs';
import { type Placement, useFloating } from '../Floating/useFloating';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  /** The tip. Keep it to a sentence; anything interactive belongs in a Popover. */
  content: ReactNode;
  /** The single child that triggers it. It must be focusable (button, link) or get tabIndex={0}. */
  children: ReactElement<Record<string, unknown>>;
  placement?: Placement;
  /** Hover delay in ms. Default 120. Focus opens at once. */
  delay?: number;
  className?: string;
}

/**
 * A small glass tooltip. Opens on hover and on keyboard focus, closes on blur, leave and Escape.
 * Rendered in a portal, so no `overflow: hidden` ancestor can clip it. Touch devices open it on
 * tap (focus) and it closes on the next tap elsewhere.
 */
export function Tooltip({ content, children, placement = 'top', delay = 120, className }: TooltipProps) {
  const id = useId();
  const anchor = useRef<HTMLElement | null>(null);
  const tip = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef(0);
  const pos = useFloating(anchor, tip, open, placement);

  const show = useCallback(
    (immediate: boolean) => {
      window.clearTimeout(timer.current);
      if (immediate) setOpen(true);
      else timer.current = window.setTimeout(() => setOpen(true), delay);
    },
    [delay],
  );
  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, hide]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const childProps = children.props as {
    onPointerEnter?: (e: ReactPointerEvent) => void;
    onPointerLeave?: (e: ReactPointerEvent) => void;
    onFocus?: (e: FocusEvent) => void;
    onBlur?: (e: FocusEvent) => void;
    ref?: React.Ref<HTMLElement>;
  };

  const trigger = cloneElement(children, {
    ref: mergeRefs(anchor, childProps.ref),
    'aria-describedby': open ? id : undefined,
    onPointerEnter: (e: ReactPointerEvent) => {
      childProps.onPointerEnter?.(e);
      if (e.pointerType !== 'touch') show(false);
    },
    onPointerLeave: (e: ReactPointerEvent) => {
      childProps.onPointerLeave?.(e);
      hide();
    },
    onFocus: (e: FocusEvent) => {
      childProps.onFocus?.(e);
      show(true);
    },
    onBlur: (e: FocusEvent) => {
      childProps.onBlur?.(e);
      hide();
    },
  });

  return (
    <>
      {trigger}
      {open
        ? createPortal(
            <div
              ref={tip}
              id={id}
              role="tooltip"
              className={cn(styles.tip, className)}
              data-placement={pos?.placement ?? placement}
              style={{
                top: pos?.top ?? 0,
                left: pos?.left ?? 0,
                visibility: pos ? 'visible' : 'hidden',
              }}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
