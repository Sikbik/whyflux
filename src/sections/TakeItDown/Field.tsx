import { type FocusEvent, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject, useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { FieldRenderer } from './render/draw';
import type { Domain } from './render/layout';
import { SLOT, type Sim } from './sim/engine';
import { SETTLE_S, WEAPONS } from './sim/model';
import { useLaneVersion, useSimValue } from './useSim';
import styles from './TakeItDown.module.css';

/** How far from a node a pointer still counts as aiming at it (touch gets more room). */
const AIM_MOUSE = 24;
const AIM_TOUCH = 34;
/** A tap is a press that barely moved and did not linger. */
const TAP_MOVE = 10;
const TAP_MS = 600;

export interface FieldProps {
  sim: Sim;
  lane: number;
  domain: Domain;
  renderers: Set<FieldRenderer>;
  /** The element that wears the lane's mood: the canvas reads its colour roles. */
  moodRef: RefObject<HTMLElement | null>;
  reduced: boolean;
  redraw: () => void;
  /** Names the lane for assistive tech. */
  label: string;
}

const STATE_WORDS: Record<number, string> = {
  [SLOT.UP]: 'running a copy',
  [SLOT.UNDETECTED]: 'offline, not yet noticed',
  [SLOT.WAIT]: 'offline, a rebuild is pending',
  [SLOT.OWNER]: 'offline, waiting for a redeploy',
  [SLOT.INSTALL]: 'installing a copy',
  [SLOT.WARM]: 'starting a copy',
};

/**
 * The canvas of one lane, with everything that makes it playable: pointer aiming (hover shows the
 * blast radius, press fires), tap on touch, and a keyboard listbox of every target (arrows move,
 * Enter fires). The canvas is decoration; the listbox is its text twin.
 */
export function Field({ sim, lane, domain, renderers, moodRef, reduced, redraw, label }: FieldProps) {
  const uid = useId();
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const rend = useRef<FieldRenderer | null>(null);
  const tap = useRef<{ x: number; y: number; t: number; id: number } | null>(null);
  const [active, setActive] = useState(-1);
  const version = useLaneVersion(sim, lane);
  const weapon = useSimValue(sim, (s) => s.weapon, 1);
  const L = sim.lanes[lane]!;

  useEffect(() => {
    const el = canvas.current;
    const host = box.current;
    const mood = moodRef.current;
    if (!el || !host || !mood) return;
    let r: FieldRenderer;
    try {
      r = new FieldRenderer({ canvas: el, paletteSource: mood, sim, lane, domain });
    } catch {
      return; // no Canvas 2D: the narration and the listbox still carry the lane
    }
    rend.current = r;
    renderers.add(r);
    const fit = () => {
      const b = host.getBoundingClientRect();
      r.resize(b.width, b.height, Math.min(2, window.devicePixelRatio || 1));
      redraw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    const io = new IntersectionObserver(
      ([e]) => {
        r.visible = !!e?.isIntersecting;
        if (r.visible) {
          r.skip();
          redraw();
        }
      },
      { rootMargin: '160px 0px' },
    );
    io.observe(host);
    // The palette follows the motion toggle's re-theming and the document font once it is loaded.
    void document.fonts?.ready.then(() => {
      r.refreshPalette();
      redraw();
    });
    return () => {
      ro.disconnect();
      io.disconnect();
      renderers.delete(r);
      r.dispose();
      rend.current = null;
    };
  }, [sim, lane, domain, renderers, moodRef, redraw]);

  const setHover = (host: number, kbd: boolean) => {
    const h = sim.hover;
    if (h.lane === lane && h.host === host && h.kbd === kbd) return;
    h.lane = host >= 0 ? lane : -1;
    h.host = host;
    h.kbd = kbd;
    if (reduced) redraw();
  };

  const settle = (seconds: number) => {
    if (!reduced) return;
    sim.advance(seconds);
    redraw();
  };

  const fire = (host: number, x?: number, y?: number) => {
    if (host < 0) {
      if (x !== undefined && y !== undefined) {
        rend.current?.miss(x, y, performance.now() / 1000);
        if (reduced) redraw();
      }
      return;
    }
    if (sim.fireAt(lane, host)) settle(SETTLE_S);
  };

  const local = (e: { clientX: number; clientY: number }) => {
    const b = box.current!.getBoundingClientRect();
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (e.pointerType === 'touch') return;
    const { x, y } = local(e);
    setHover(rend.current?.hostAt(x, y, AIM_MOUSE) ?? -1, false);
  };

  const onPointerLeave = () => setHover(-1, false);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === 'mouse') {
      if (e.button !== 0) return;
      const { x, y } = local(e);
      fire(rend.current?.hostAt(x, y, AIM_MOUSE) ?? -1, x, y);
      return;
    }
    // Touch and pen fire on lift, so a swipe that scrolls the page never fires.
    tap.current = { ...local(e), t: performance.now(), id: e.pointerId };
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    const t = tap.current;
    tap.current = null;
    if (!t || e.pointerType === 'mouse' || t.id !== e.pointerId) return;
    const p = local(e);
    if (Math.hypot(p.x - t.x, p.y - t.y) > TAP_MOVE || performance.now() - t.t > TAP_MS) return;
    fire(rend.current?.hostAt(p.x, p.y, AIM_TOUCH) ?? -1, p.x, p.y);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const r = rend.current;
    if (!r) return;
    const dir = e.key === 'ArrowLeft' ? 'left' : e.key === 'ArrowRight' ? 'right' : e.key === 'ArrowUp' ? 'up' : e.key === 'ArrowDown' ? 'down' : null;
    if (dir) {
      e.preventDefault();
      const next = r.neighbor(active, dir);
      setActive(next);
      setHover(next, true);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = active >= 0 ? active : r.neighbor(-1, 'right');
      setActive(target);
      fire(target);
    }
  };

  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    // A press focuses the field too, and that must not move the reticle: only the keyboard does.
    if (!e.currentTarget.matches(':focus-visible')) return;
    const r = rend.current;
    if (!r) return;
    const start = active >= 0 && L.alive[active] ? active : r.neighbor(-1, 'right');
    setActive(start);
    setHover(start, true);
  };

  const onBlur = () => {
    if (sim.hover.lane === lane && sim.hover.kbd) setHover(-1, true);
  };

  // The text twin: every target, with what it is doing for the app.
  const w = L.world;
  const optionLabel = (h: number): string => {
    const prov = w.providers[w.provider[h]!];
    const where = w.countryLabels[w.country[h]!] ?? '';
    const name = L.kind === 'cloud' ? `Server in the ${where}, data center ${(w.site[h]! % 3) + 1}` : `${prov?.real ? `${prov.name}, ` : ''}${where}`;
    if (!L.alive[h]) {
      for (let s = 0; s < L.nSlots; s++) if (L.slotHost[s] === h) return `${name}, ${STATE_WORDS[L.slotState[s]!] ?? 'offline'}`;
      return `${name}, offline`;
    }
    for (let s = 0; s < L.nSlots; s++) if (L.slotHost[s] === h) return `${name}, ${STATE_WORDS[L.slotState[s]!] ?? 'idle'}`;
    return `${name}, idle`;
  };
  void version;

  const weaponTitle = WEAPONS[weapon - 1]?.title ?? '';

  return (
    <div
      ref={box}
      className={cn(styles.field, 'field')}
      data-lane={lane}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        tap.current = null;
      }}
    >
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
      <div
        className={styles.targets}
        role="listbox"
        tabIndex={0}
        aria-label={`${label}: ${w.n} targets, arrow keys choose one, Enter fires ${weaponTitle.toLowerCase()} at it`}
        aria-activedescendant={active >= 0 ? `${uid}-${active}` : undefined}
        aria-keyshortcuts="Enter"
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        {Array.from({ length: w.n }, (_, h) => (
          <div key={h} id={`${uid}-${h}`} role="option" aria-selected={h === active} aria-disabled={!L.alive[h]} className="sr-only">
            {optionLabel(h)}
          </div>
        ))}
      </div>
    </div>
  );
}
