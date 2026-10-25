import { ArrowDown, ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fluxStats } from '@/data/flux';
import type { Source } from '@/data/types';
import { cn } from '@/lib/cn';
import type { GlobeHover } from '@/lib/globe/engine';
import { type NodePoint, useFluxLive } from '@/lib/live';
import { subscribeScroll } from '@/lib/scroll';
import { ArtPlate, CountUp, FreshnessChip, LinkButton, Reveal, Sources } from '@/ui';
import { GlobeReticle, type GlobeReticleHandle } from './GlobeHud';
import { HeroGlobe } from './HeroGlobe';
import { Headline } from './Headline';
import styles from './Hero.module.css';

const NO_SITES: readonly NodePoint[] = [];

/** The distinct sources behind the strip's four numbers, from the sourced stats. */
function stripSources(): Source[] {
  const seen = new Map<string, Source>();
  for (const id of ['nodes', 'countries', 'operators', 'apps']) {
    const s = fluxStats.find((x) => x.id === id)?.source;
    if (s && !seen.has(s.url)) seen.set(s.url, s);
  }
  return [...seen.values()];
}

/**
 * Chapter 00: the hero. A 3D globe of the real node positions, a headline, two ways in, and the
 * network's own numbers under it. A showcase, not a game: the globe spins, shows what is under the
 * pointer, and quietly re-routes around an ambient failure; the playable version is chapter 05.
 * When real positions are not available it draws an illustrative network and says so.
 *
 * Restyle v2: no eyebrow, no chips, no gradients or glows. Just the headline, one lede, two actions,
 * and a flat strip of numbers.
 */
export function Hero() {
  const live = useFluxLive();
  const root = useRef<HTMLElement>(null);
  const windowEl = useRef<HTMLDivElement>(null);
  const reticle = useRef<GlobeReticleHandle>(null);

  const [go, setGo] = useState(false); // fonts are in: start the entrance
  const [glReady, setGlReady] = useState(false);
  const [glFailed, setGlFailed] = useState(false);
  const [waited, setWaited] = useState(false);
  const [fallback, setFallback] = useState<NodePoint[]>([]);

  // The entrance waits for the fonts, so the headline never reflows mid-reveal.
  useEffect(() => {
    let alive = true;
    const start = () => alive && setGo(true);
    if (document.fonts?.ready) void document.fonts.ready.then(() => window.setTimeout(start, 60));
    else start();
    const guard = window.setTimeout(start, 1200);
    return () => {
      alive = false;
      window.clearTimeout(guard);
    };
  }, []);

  // Real node points normally arrive within a moment. If they do not, an illustrative network
  // takes their place (and is labelled as such). It is generated lazily: it needs the land mask.
  const real = live.points.length > 0;
  useEffect(() => {
    const id = window.setTimeout(() => setWaited(true), 1600);
    return () => window.clearTimeout(id);
  }, []);
  const { cumulus, nimbus, stratus } = live.tiers;
  useEffect(() => {
    if (real || !waited) return;
    let alive = true;
    void import('@/lib/globe/procedural').then((m) => {
      if (alive) setFallback(m.proceduralSites(520, { cumulus, nimbus, stratus }));
    });
    return () => {
      alive = false;
    };
  }, [real, waited, cumulus, nimbus, stratus]);
  const sites = real ? live.points : fallback.length ? fallback : NO_SITES;
  const illustrative = !real && fallback.length > 0;

  // Scroll writes --p on the hero: the copy lifts and fades, the planet lags behind the page.
  useEffect(
    () =>
      subscribeScroll(({ y, vh }) => {
        root.current?.style.setProperty('--p', Math.min(1, Math.max(0, y / vh)).toFixed(4));
      }),
    [],
  );

  const onHover = (h: GlobeHover | null) => reticle.current?.hover(h);

  const sources = useMemo(stripSources, []);
  const showCanvas = glReady && !glFailed;

  return (
    <section ref={root} id="top" aria-label="Introduction" className={styles.hero} data-gl={showCanvas ? 'ready' : glFailed ? 'failed' : 'loading'}>
      {/* The poster: shows while the globe loads, and stays for visitors without WebGL. */}
      <ArtPlate src="hero-horizon" priority position="50% 70%" className={styles.poster} />

      <div className={styles.stage}>
        <HeroGlobe
          sites={sites}
          anchor={windowEl}
          onHover={onHover}
          onReady={() => setGlReady(true)}
          onFail={() => setGlFailed(true)}
        />
        <GlobeReticle ref={reticle} />
      </div>

      <div className={styles.copy}>
        <Headline go={go} />

        <Reveal immediate hold={!go} delay={1250} className={styles.leadWrap}>
          <p className={cn('t-lead', styles.lead)}>
            Flux runs your app on as many independent nodes as you choose.{' '}
            <span className={styles.leadLong}>
              Lose a node, a data center, even a country: with copies elsewhere, traffic fails over in seconds and the
              network rebuilds what was lost.
            </span>
            <span className={styles.leadShort}>With copies elsewhere, traffic fails over in seconds.</span>
          </p>
        </Reveal>

        <Reveal immediate hold={!go} delay={1500} className={styles.ctas}>
          <LinkButton href="#takedown" variant="primary" size="lg" iconEnd={<ArrowRight size={18} aria-hidden="true" />}>
            Try to take it down
          </LinkButton>
          <LinkButton href="#kubernetes" variant="secondary" size="lg" iconEnd={<ArrowDown size={16} aria-hidden="true" />}>
            How it works
          </LinkButton>
        </Reveal>
      </div>

      {/* The window the planet shows through. It also anchors the planet on phones. */}
      <div ref={windowEl} className={styles.window}>
        {illustrative ? <p className={styles.note}>Node positions are illustrative</p> : null}
      </div>

      <Reveal immediate hold={!go} delay={1700} className={styles.barWrap}>
        <section aria-label="The network right now" className={styles.bar}>
          <dl className={styles.stats}>
            <Num label="Nodes online" value={live.totalNodes || undefined} />
            <Num label="Countries" value={live.countries} />
            <Num label="Operator IDs" value={live.operators} />
            <Num label="Apps running" value={live.runningApps} />
          </dl>
          <span className={styles.meta}>
            <FreshnessChip status={live.status} fetchedAt={live.fetchedAt} />
            <Sources
              items={sources}
              label="Sources"
              title="Nodes and countries are live; apps and operator IDs are from the latest network snapshot"
            />
          </span>
        </section>
      </Reveal>
    </section>
  );
}

/** One number and its name. The term comes first in the markup and sits under the number on screen. */
function Num({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className={styles.fig}>
      <dt className={styles.figLabel}>{label}</dt>
      <dd className={styles.figValue}>
        <CountUp value={value} immediate duration={2200} />
      </dd>
    </div>
  );
}
