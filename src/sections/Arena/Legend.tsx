import type { Verdict } from '@/data/types';
import { HexGlyph } from './Glyph';
import { RUBRIC, verdictWord } from './model';
import styles from './Legend.module.css';

const SCALE = [...RUBRIC].reverse(); // 0 to 5
const ANSWERS: { verdict: Verdict; score: number }[] = [
  { verdict: 'yes', score: RUBRIC[0]?.score ?? 5 },
  { verdict: 'partial', score: RUBRIC.find((r) => r.verdict === 'partial')?.score ?? 3 },
  { verdict: 'no', score: RUBRIC.find((r) => r.verdict === 'no' && r.score > 0)?.score ?? 1 },
  { verdict: 'na', score: 0 },
];

/**
 * The key to the hexagons, in the figure's own language: how full it is is the score, how it is
 * outlined is the answer. Decorative: the same words are on every cell's accessible name.
 */
export function MatrixLegend() {
  return (
    <div className={styles.legend} aria-hidden="true">
      <div className={styles.group}>
        <span className={styles.title}>Fill is the score</span>
        <span className={styles.scale}>
          {SCALE.map((r) => (
            <span key={r.score} className={styles.step}>
              <HexGlyph score={r.score} verdict={r.verdict} size={16} />
              <i>{r.score}</i>
            </span>
          ))}
        </span>
      </div>
      <div className={styles.group}>
        <span className={styles.title}>Outline is the answer</span>
        <span className={styles.scale}>
          {ANSWERS.map((a) => (
            <span key={a.verdict} className={styles.step}>
              <HexGlyph score={a.score} verdict={a.verdict} size={16} />
              <i>{verdictWord(a.verdict)}</i>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
