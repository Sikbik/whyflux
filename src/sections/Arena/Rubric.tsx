import { formatDate } from '@/lib/format';
import { Popover } from '@/ui';
import { HexGlyph } from './Glyph';
import { RUBRIC, SCORES_CHECKED } from './model';
import styles from './Rubric.module.css';

/**
 * "How we scored": the 0 to 5 rubric, from research/competitors.md section 1, behind a plain link, so
 * nobody has to take a score on faith and nobody has to read the method either.
 */
export function HowWeScored() {
  return (
    <Popover
      placement="top"
      label="How we scored"
      className={styles.trigger}
      panelClassName={styles.panel}
      trigger="How we scored"
    >
      <p className={styles.title}>One rubric for every cell</p>
      <ol role="list" className={styles.list}>
        {RUBRIC.map((r) => (
          <li key={r.score}>
            <HexGlyph score={r.score} verdict={r.verdict} size={16} className={styles.glyph} />
            <b>{r.score}</b>
            <span>{r.meaning}</span>
          </li>
        ))}
      </ol>
      <p className={styles.note}>
        Web2 clouds are scored on what you get by default for one deployment: multi-zone setups are real, but you build
        and pay for them, and every copy is still on the same company's machines. The scores are the researchers'
        judgment, not a measurement. Checked on {formatDate(SCORES_CHECKED)}.
      </p>
    </Popover>
  );
}
