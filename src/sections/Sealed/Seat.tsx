import { Play, Square } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useUrlParam } from '@/lib/urlState';
import { Button, Sources, useActive, useIsPhone, useReducedMotion } from '@/ui';
import { Attempts } from './Attempts';
import { STAGE_COMPACT, STAGE_WIDE } from './geometry';
import { type Attempt, buildRings, type Host, HOST_NAME, PACE, questionFor, ringOf, tally, verdictOn } from './model';
import { NodeToggle } from './NodeToggle';
import { detailFor, Readout } from './Readout';
import { Stage } from './Stage';
import { useSeat } from './useSeat';
import { useVisibleEnough } from './useVisibleEnough';
import { VERDICT } from './verdict';
import styles from './Seat.module.css';

const asHost = (v: string | null): Host | null => (v === 'legacy' || v === 'arcane' ? v : null);

/**
 * The operator's seat: the chapter's one big interaction. A crystal in layers of hexagons, an operator at
 * the left, and the ways to try to get at the app, each a real button. Pick a kind of node, then an
 * attempt: a beam leaves the operator, the stage shows where it stops, and the readout under it says what
 * came back. The first time the stage is 70 percent in view it plays once on its own (the attempts on a
 * legacy node, a flip to ArcaneOS, the same attempts again) and then hands over. Under reduced motion
 * nothing plays: the picture is its end state.
 */
export function Seat({ rows, header }: { rows: readonly Attempt[]; header: ReactNode }) {
  const reduced = useReducedMotion();
  const phone = useIsPhone();
  const root = useRef<HTMLDivElement>(null);
  const stageBox = useRef<HTMLDivElement>(null);
  const active = useActive(root);
  const watched = useVisibleEnough(stageBox, 0.7);
  const seen = useVisibleEnough(stageBox, 0.2);
  // The layers draw themselves in the first time the stage is properly in view, and stay drawn. Without an
  // observer there is nothing to wait for: draw them at once.
  const [arrivedOnce, setArrivedOnce] = useState(false);
  useEffect(() => {
    if (seen) setArrivedOnce(true);
  }, [seen]);
  const arrived = arrivedOnce || typeof IntersectionObserver === 'undefined';

  const [hostParam, setHostParam] = useUrlParam('host');
  const initialHost = asHost(hostParam);
  const seat = useSeat({ rows, initialHost, reduced, active });
  const { host, run, tried, finished } = seat;
  const box = phone ? STAGE_COMPACT : STAGE_WIDE;

  // The beam takes a moment to arrive. What it finds (the answer in the readout, the answer in the row) shows
  // the moment it lands, the same instant the ring answers, never before.
  const [landed, setLanded] = useState(0);
  const runSeq = run?.seq ?? 0;
  const runBeam = run ? PACE.beam[run.host] : 0;
  useEffect(() => {
    if (runSeq === 0 || reduced) return;
    const id = window.setTimeout(() => setLanded(runSeq), runBeam);
    return () => window.clearTimeout(id);
  }, [runSeq, runBeam, reduced]);
  // The legacy pass is a montage (its answers do not wait either): nothing is held back for it.
  const montage = run !== null && run.auto && run.host === 'legacy';
  const inFlight = run !== null && !reduced && !montage && landed !== run.seq;
  // An attempt tried for the first time has no answer until its beam lands (one that has run before keeps its mark).
  const flyingKey = inFlight && run.fresh && run.host === host ? run.key : null;

  const rings = useMemo(() => buildRings(rows), [rows]);
  const [preview, setPreview] = useState<string | null>(null);
  const previewRing = useMemo(() => {
    const row = preview ? rows.find((r) => r.key === preview) : undefined;
    return row ? ringOf(row, rings) : null;
  }, [preview, rows, rings]);

  // The opening sequence: once, when the stage is properly in view, and never if the visitor got there first.
  const started = useRef(false);
  const touched = useRef(false);
  const { playIntro } = seat;
  useEffect(() => {
    if (!watched || started.current || touched.current || reduced) return;
    // A beat to take in the sealed crystal (the layers are still drawing themselves in) before anything attacks it.
    const id = window.setTimeout(() => {
      if (started.current || touched.current) return;
      started.current = true;
      playIntro(initialHost ? [initialHost] : ['legacy', 'arcane']);
    }, 1500);
    return () => window.clearTimeout(id);
  }, [watched, reduced, initialHost, playIntro]);

  const chooseHost = (next: Host) => {
    touched.current = true;
    seat.setHost(next);
    setHostParam(next);
  };

  // What the polite live region says: one line per attempt the visitor makes, a summary when a run ends.
  const [say, setSay] = useState('');
  useEffect(() => {
    if (!run || run.auto) return;
    const row = rows.find((r) => r.key === run.key);
    if (!row) return;
    const detail = detailFor(row, run.host);
    setSay(`${questionFor(row)} ${HOST_NAME[run.host]}: ${VERDICT[verdictOn(row, run.host)].word}${detail ? `. ${detail}` : ''}`);
  }, [run, rows]);
  useEffect(() => {
    if (finished === 0) return;
    const t = tally(rows, tried[host], host);
    setSay(`${HOST_NAME[host]}, ${rows.length} attempts: ${t.no} answered no, ${t.partial} partly, ${t.yes} yes.`);
    // Only when a run ends by itself: `finished` is the one dependency on purpose.
  }, [finished]);

  const row = run && run.host === host ? rows.find((r) => r.key === run.key) : undefined;
  const allTried = tried[host].length >= rows.length;

  const runAll = () => {
    touched.current = true;
    // On a phone the list sits under the stage: bring the stage into view so the run can be watched.
    if (phone) stageBox.current?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    seat.runAll();
  };

  return (
    <div ref={root} className={styles.seat} data-host={host} data-reduced={reduced || undefined}>
      <div className={styles.head}>{header}</div>

      <div className={styles.app}>
        <NodeToggle host={host} onChange={chooseHost} />
        <div ref={stageBox} className={styles.stage}>
          <Stage
            box={box}
            rows={rows}
            rings={rings}
            host={host}
            tried={tried[host]}
            run={run}
            previewRing={previewRing}
            reduced={reduced}
            arrived={arrived}
            wave={!reduced && host === 'arcane' ? finished : 0}
          />
        </div>
        <Readout
          row={row}
          host={host}
          run={run && run.host === host ? run : null}
          landed={!inFlight}
          type={!reduced && !montage}
          playing={seat.playing}
        />
      </div>

      <div className={styles.list}>
        <div className={styles.listHead}>
          <h3 className={styles.ask} id="sealed-ask">
            Can the node operator get in?
          </h3>
          {seat.playing ? (
            <Button variant="ghost" size="sm" icon={<Square size={13} aria-hidden="true" />} onClick={seat.stop}>
              Stop
            </Button>
          ) : (
            <Button variant="ghost" size="sm" icon={<Play size={14} aria-hidden="true" />} onClick={runAll}>
              {allTried ? 'Run again' : 'Run all'}
            </Button>
          )}
        </div>
        <Attempts
          rows={rows}
          host={host}
          tried={tried[host]}
          flying={flyingKey}
          run={run}
          labelledBy="sealed-ask"
          detail={(r) => (
            <p className={styles.inline}>
              <span>{detailFor(r, host)}</span>
              <Sources items={r.sources} />
            </p>
          )}
          onAttempt={(key) => {
            touched.current = true;
            seat.attempt(key);
          }}
          onPreview={setPreview}
        />
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {say}
      </p>
    </div>
  );
}
