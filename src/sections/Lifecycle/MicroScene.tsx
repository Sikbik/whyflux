import { Check } from 'lucide-react';
import { type CSSProperties, useRef } from 'react';
import { cn } from '@/lib/cn';
import { useActive } from '@/ui';
import { SAMPLE_APP } from './model';
import type { OnRampId } from './model';
import css from './MicroScene.module.css';

/** A time window on the loop (0 to 1): the element eases in between `a` and `b`. */
const win = (a: number, b: number): CSSProperties => ({ '--a': a, '--b': b }) as CSSProperties;

function Tick() {
  return <Check size={12} strokeWidth={2.4} aria-hidden="true" />;
}

/** The FluxCloud form fills in, then Deploy goes. */
function DockerScene() {
  return (
    <div className={css.body}>
      <div className={css.row}>
        <span className={css.key}>image</span>
        <span className={cn(css.val, css.wipe)} style={win(0.06, 0.3)}>
          yourname/{SAMPLE_APP}:latest
        </span>
      </div>
      <div className={css.row}>
        <span className={css.key}>instances</span>
        <span className={css.pips}>
          {[0.32, 0.38, 0.44].map((a) => (
            <i key={a} className={css.pip} style={win(a, a + 0.06)} />
          ))}
        </span>
      </div>
      {(
        [
          ['cpu', 0.5, 0.42],
          ['ram', 0.56, 0.62],
          ['hdd', 0.62, 0.3],
        ] as const
      ).map(([k, a, f]) => (
        <div className={css.row} key={k}>
          <span className={css.key}>{k}</span>
          <span className={css.gauge}>
            <i className={css.fill} style={{ ...win(a, a + 0.1), '--f': f } as CSSProperties} />
          </span>
        </div>
      ))}
      <div className={css.foot}>
        <span className={css.deploy} style={win(0.74, 0.8)}>
          <span className={css.idle} style={win(0.86, 0.9)}>
            Deploy
          </span>
          <span className={css.done} style={win(0.86, 0.9)}>
            <Tick /> Submitted
          </span>
        </span>
      </div>
    </div>
  );
}

/** `git push`, then the build scrolls by. */
function GitScene() {
  const lines: [string, number][] = [
    ['Detected framework', 0.28],
    ['Built a container', 0.4],
    ['Deployed on Flux nodes', 0.54],
    ['Live', 0.68],
  ];
  return (
    <div className={css.body}>
      <div className={css.row}>
        <span className={css.prompt}>$</span>
        <span className={cn(css.val, css.wipe)} style={win(0.05, 0.22)}>
          git push
        </span>
      </div>
      {lines.map(([text, a]) => (
        <div className={cn(css.row, css.log)} key={text} style={win(a, a + 0.06)}>
          <span className={css.tickMark}>
            <Tick />
          </span>
          <span className={css.val}>{text}</span>
        </div>
      ))}
      <div className={css.foot}>
        <span className={css.deploy} style={win(0.8, 0.86)}>
          <span className={css.done}>Every push redeploys</span>
        </span>
      </div>
    </div>
  );
}

/** A prompt, then the agent's tool calls tick by. */
function AgentScene() {
  const calls: [string, number][] = [
    ['quote', 0.3],
    ['deploy', 0.42],
    ['pay', 0.54],
    ['logs', 0.66],
  ];
  return (
    <div className={css.body}>
      <div className={css.ask}>
        <span className={cn(css.val, css.wipe)} style={win(0.05, 0.25)}>
          “Deploy my app on Flux”
        </span>
      </div>
      <div className={css.calls}>
        {calls.map(([name, a]) => (
          <span className={css.call} key={name} style={win(a, a + 0.06)}>
            <span>{name}</span>
            <span className={css.callTick} style={win(a + 0.06, a + 0.1)}>
              <Tick />
            </span>
          </span>
        ))}
      </div>
      <div className={css.foot}>
        <span className={css.deploy} style={win(0.8, 0.86)}>
          <span className={css.done}>
            <Tick /> Running
          </span>
        </span>
      </div>
    </div>
  );
}

/** Before a door is chosen: the three ways in, typed one after another, then the spec they all lead to. */
function NeutralScene() {
  const gauges: [string, number, number][] = [
    ['cpu', 0.56, 0.42],
    ['ram', 0.62, 0.62],
    ['hdd', 0.68, 0.3],
  ];
  return (
    <div className={css.body}>
      <div className={css.entries}>
        <div className={css.entry}>
          <span className={cn(css.val, css.wipe)} style={win(0.05, 0.19)}>
            yourname/{SAMPLE_APP}:latest
          </span>
        </div>
        <div className={css.entry}>
          <span className={css.prompt}>$</span>
          <span className={cn(css.val, css.wipe)} style={win(0.2, 0.3)}>
            git push
          </span>
        </div>
        <div className={css.entry}>
          <span className={cn(css.val, css.wipe, css.quote)} style={win(0.31, 0.48)}>
            “Deploy my app on Flux”
          </span>
        </div>
      </div>
      {gauges.map(([k, a, f]) => (
        <div className={css.row} key={k}>
          <span className={css.key}>{k}</span>
          <span className={css.gauge}>
            <i className={css.fill} style={{ ...win(a, a + 0.12), '--f': f } as CSSProperties} />
          </span>
        </div>
      ))}
      <div className={css.foot}>
        <span className={css.deploy} style={win(0.82, 0.88)}>
          <span className={css.done}>
            <Tick /> Ready to sign
          </span>
        </span>
      </div>
    </div>
  );
}

export interface MicroSceneProps {
  kind: OnRampId | 'neutral';
  className?: string;
  /** The parent writes `--mp` (the pinned story does, from scroll): no loop, no clock. */
  scrub?: boolean;
  style?: CSSProperties;
}

/**
 * A six second loop of one door in use, set bare on the page. All three share one skeleton (a typed line,
 * four beats, a last line) and one clock, so none of them is the main road. Everything on it is a window on a
 * single registered number (`--mp`), the same trick the pinned story uses on scroll. It runs only while on
 * screen and under reduced motion shows its finished frame.
 */
export function MicroScene({ kind, className, scrub = false, style }: MicroSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const live = useActive(ref);
  return (
    <div
      ref={ref}
      className={cn(css.micro, className)}
      data-kind={kind}
      data-live={(!scrub && live) || undefined}
      data-scrub={scrub || undefined}
      style={style}
      aria-hidden="true"
    >
      {kind === 'docker' ? <DockerScene /> : kind === 'git' ? <GitScene /> : kind === 'agent' ? <AgentScene /> : <NeutralScene />}
    </div>
  );
}
