import { ArrowUpRight, Check, Copy, Equal, Play, RotateCcw, TriangleAlert, X } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { type FluxLiveSnapshot, formatInt } from '@/lib/live';
import { copyText } from '@/lib/share';
import { LINKS } from '@/sections/chapters';
import { Button, IconButton, LinkButton, Reveal, useReducedMotion, useToast } from '@/ui';
import { CHECKS, type CheckDef, type CheckId, type Compare } from './checks';
import { Pulse } from './Pulse';
import styles from './CheckUs.module.css';

/** Flux's own block explorer: the other place to look a block up. Checked on 2026-10-24. */
const EXPLORER = 'https://explorer.runonflux.io/';

type Phase = 'idle' | 'running' | 'done' | 'failed';
interface Line {
  id: number;
  kind: 'out' | 'dim' | 'err';
  text: string;
}
interface Run {
  phase: Phase;
  lines: Line[];
  compares: Compare[];
  ms?: number;
}
const IDLE: Run = { phase: 'idle', lines: [], compares: [] };

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const id = window.setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      window.clearTimeout(id);
      resolve();
    });
  });

function formatBytes(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(n < 10_240 ? 1 : 0)} KB`;
}

/** One quiet pass of syntax colour over a line of JSON (or a comment). */
function Colored({ text }: { text: string }): ReactNode {
  if (/^\s*(\/\/|#)/.test(text) || text === '…') return <span className={styles.comment}>{text}</span>;
  const out: ReactNode[] = [];
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b/g;
  let last = 0;
  let m: RegExpExecArray | null = re.exec(text);
  while (m) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(
        <span key={m.index} className={m[2] ? styles.key : styles.str}>
          {m[1]}
        </span>,
      );
      if (m[2]) out.push(m[2]);
    } else if (m[3] !== undefined) {
      out.push(
        <span key={m.index} className={styles.num}>
          {m[3]}
        </span>,
      );
    } else if (m[4] !== undefined) {
      out.push(
        <span key={m.index} className={styles.lit}>
          {m[4]}
        </span>,
      );
    }
    last = m.index + m[0].length;
    m = re.exec(text);
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const VERDICT = {
  match: { word: 'Match', icon: Check },
  close: { word: 'Close', icon: Equal },
  differs: { word: 'Differs', icon: TriangleAlert },
} as const;

function worst(compares: readonly Compare[]): Compare['tone'] | undefined {
  if (compares.some((c) => c.tone === 'differs')) return 'differs';
  if (compares.some((c) => c.tone === 'close')) return 'close';
  return compares.length > 0 ? 'match' : undefined;
}

export interface CheckUsProps {
  live: FluxLiveSnapshot;
  /** The height the heartbeat is showing: what the block height check is compared with. */
  height?: number;
}

/**
 * Beat D: check us. The three public requests behind the wall as one row of links. Pick one and a
 * terminal opens under the row, runs the request in the visitor's own browser, prints what came back
 * and sets it beside the number the wall shows. Until then there is no terminal at all. Failures are
 * said in plain words, never hidden.
 */
export function CheckUs({ live, height }: CheckUsProps) {
  const reduced = useReducedMotion();
  const { toast } = useToast();
  const [selected, setSelected] = useState<CheckId>('nodes');
  const [open, setOpen] = useState(false);
  const [runs, setRuns] = useState<Record<CheckId, Run>>({ nodes: IDLE, height: IDLE, capacity: IDLE });
  const aborts = useRef<Partial<Record<CheckId, AbortController>>>({});
  const latest = useRef({ live, height });
  latest.current = { live, height };
  const lineId = useRef(0);

  const patch = (id: CheckId, next: Partial<Run> | ((r: Run) => Partial<Run>)) =>
    setRuns((all) => ({ ...all, [id]: { ...all[id], ...(typeof next === 'function' ? next(all[id]) : next) } }));

  const run = async (def: CheckDef) => {
    aborts.current[def.id]?.abort();
    const ctl = new AbortController();
    aborts.current[def.id] = ctl;
    patch(def.id, { phase: 'running', lines: [], compares: [], ms: undefined });
    const res = await def.run({ signal: ctl.signal, live: latest.current.live, height: latest.current.height });
    if (ctl.signal.aborted) return;
    if (!res.ok) {
      patch(def.id, { phase: 'failed', ms: res.ms, lines: [{ id: ++lineId.current, kind: 'err', text: res.error }] });
      return;
    }
    const lines: Line[] = [
      { id: ++lineId.current, kind: 'dim', text: `# ${def.host} answered in ${formatInt(res.ms)} ms (${formatBytes(res.bytes)}), first lines` },
      ...res.preview.map((text) => ({ id: ++lineId.current, kind: 'out' as const, text })),
    ];
    // Print the lines in one at a time, like a terminal, unless motion is off.
    for (const line of lines) {
      patch(def.id, (r) => ({ lines: [...r.lines, line] }));
      if (!reduced) await sleep(line.kind === 'dim' ? 220 : 45, ctl.signal);
      if (ctl.signal.aborted) return;
    }
    patch(def.id, { phase: 'done', ms: res.ms, compares: res.compares });
  };

  const choose = (def: CheckDef) => {
    setSelected(def.id);
    setOpen(true);
    void run(def);
  };

  const def = CHECKS.find((c) => c.id === selected) ?? CHECKS[0];
  if (!def) return null;
  const current = runs[def.id];

  const onCopy = async () => {
    const ok = await copyText(def.command);
    toast(ok ? 'Command copied' : 'Could not copy the command', ok ? 'ok' : 'crit');
  };

  const verdict = worst(current.compares);
  const summary =
    current.phase === 'done' && current.compares.length > 0
      ? `${def.title}: ${current.compares.map((c) => `${c.label} ${c.here} here, ${c.wall} on the wall`).join('; ')}.`
      : current.phase === 'failed'
        ? `${def.title} failed. ${current.lines[0]?.text ?? ''}`
        : '';
  const anyClose = current.compares.some((c) => c.tone === 'close');

  return (
    <Reveal from="up" className={styles.root}>
      <div className={styles.head}>
        <h3 className={styles.h}>
          Run the request <b>yourself</b>
        </h3>
      </div>

      <ul className={styles.row} role="list">
        {CHECKS.map((c) => {
          const r = runs[c.id];
          const tone = worst(r.compares);
          const active = open && c.id === selected;
          return (
            <li key={c.id}>
              <button
                type="button"
                className={styles.run}
                data-active={active ? 'true' : undefined}
                data-phase={r.phase}
                aria-expanded={active}
                aria-controls="check-term"
                onClick={() => choose(c)}
              >
                <span className={styles.runTitle}>
                  {r.phase === 'running' ? <Pulse /> : <Play size={13} strokeWidth={2} aria-hidden="true" />}
                  <span>{c.title}</span>
                  {r.phase === 'done' && tone ? (
                    <span className={styles.mark} data-tone={tone}>
                      {VERDICT[tone].word}
                    </span>
                  ) : r.phase === 'failed' ? (
                    <span className={styles.mark} data-tone="failed">
                      Failed
                    </span>
                  ) : null}
                </span>
                <span className={styles.runPath}>{c.path.split('?')[0]}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className={styles.termWrap} data-open={open ? 'true' : 'false'}>
        <div className={styles.termClip}>
          <div className={styles.term} id="check-term" role="region" aria-label={`Run ${def.title} yourself`} data-phase={current.phase} inert={!open}>
            <div className={styles.bar}>
              <span className={styles.host}>{def.host}</span>
              <span className={styles.status} data-phase={current.phase}>
                {current.phase === 'running'
                  ? 'running'
                  : current.phase === 'done'
                    ? `${formatInt(current.ms ?? 0)} ms`
                    : current.phase === 'failed'
                      ? 'failed'
                      : 'ready'}
              </span>
              <span className={styles.barActions}>
                <Button variant="ghost" size="sm" icon={<Copy size={14} aria-hidden="true" />} onClick={onCopy}>
                  Copy
                </Button>
                <LinkButton variant="ghost" size="sm" href={def.url} iconEnd={<ArrowUpRight size={14} aria-hidden="true" />}>
                  Open
                </LinkButton>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RotateCcw size={14} aria-hidden="true" />}
                  loading={current.phase === 'running'}
                  onClick={() => void run(def)}
                >
                  Run again
                </Button>
                <IconButton variant="ghost" size="sm" aria-label="Close the terminal" icon={<X size={16} aria-hidden="true" />} onClick={() => setOpen(false)} />
              </span>
            </div>

            <pre className={styles.cmd}>
              {def.command.split('\n').map((l, i) => (
                <span key={i} className={styles.cmdLine}>
                  {i === 0 ? <span className={styles.prompt}>$ </span> : null}
                  {l.replace(/\\$/, '\\')}
                </span>
              ))}
            </pre>

            <div className={styles.out} role="log" aria-label={`Output of ${def.title}`}>
              {current.lines.length === 0 ? (
                <span className={styles.comment}># {def.returns}</span>
              ) : (
                current.lines.map((l) => (
                  <span key={l.id} className={cn(styles.line, l.kind === 'err' && styles.err)} data-kind={l.kind}>
                    {l.kind === 'out' ? <Colored text={l.text} /> : l.text}
                  </span>
                ))
              )}
              {current.phase === 'running' ? <span className={styles.caret} aria-hidden="true" /> : null}
            </div>

            {current.compares.length > 0 ? (
              <div className={styles.compare}>
                <table>
                  <caption className="sr-only">Numbers from this run next to the numbers on the wall</caption>
                  <thead>
                    <tr>
                      <th scope="col">Number</th>
                      <th scope="col">This run</th>
                      <th scope="col">The wall</th>
                      <th scope="col">Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.compares.map((c) => {
                      const V = VERDICT[c.tone];
                      return (
                        <tr key={c.label}>
                          <th scope="row">{c.label}</th>
                          <td>{c.here}</td>
                          <td>{c.wall}</td>
                          <td>
                            <span className={styles.verdict} data-tone={c.tone}>
                              <V.icon size={13} strokeWidth={2} aria-hidden="true" />
                              {V.word}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {anyClose ? <p className={styles.note}>Close is a gap a refresh explains, nodes join and leave and the wall updates on its own schedule</p> : null}
                {verdict === 'differs' ? <p className={styles.note}>A real gap, the wall may be showing an older snapshot, run it again to see</p> : null}
              </div>
            ) : null}

            <p className="sr-only" aria-live="polite">
              {summary}
            </p>
          </div>
        </div>
      </div>

      <p className={styles.look}>
        Rather look than type? The same network, as a 3D globe on{' '}
        <a href={LINKS.atlas} target="_blank" rel="noopener noreferrer">
          Flux Atlas
          <ArrowUpRight size={15} strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only"> (Opens in a new tab)</span>
        </a>{' '}
        and as a ledger in the{' '}
        <a href={EXPLORER} target="_blank" rel="noopener noreferrer">
          block explorer
          <ArrowUpRight size={15} strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only"> (Opens in a new tab)</span>
        </a>
      </p>
    </Reveal>
  );
}
