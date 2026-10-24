/**
 * The kit gallery: every kit component in its restyle-v2 state on one page, with the real Hero, Nav,
 * Footer and Interlude. A dev-only harness (it is not imported by the app, so it never ships):
 *
 *   http://127.0.0.1:5190/src/ui/gallery/index.html
 *
 * It exists so the kit can be checked and screenshotted without every section compiling. Scroll
 * targets: #top (hero), #g-interlude, #g-header, #g-center, #g-figure, #g-panels, #g-kit.
 *
 * Add `?section=<id>` to mount one real chapter on its own (lazily, so a chapter that is mid-edit
 * cannot take the rest down): fragile, kubernetes, lifecycle, depin, takedown, operators, sealed,
 * arena, cost, ecosystem, proof, join.
 */
import '@/styles/index.css';
import { Download, Server } from 'lucide-react';
import { type ComponentType, lazy, StrictMode, Suspense, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { applyStoredMotion } from '@/lib/motion';
import { Hero } from '@/sections/Hero';
import { Footer } from '@/shell/Footer';
import { Nav } from '@/shell/Nav';
import type { Source } from '@/data/types';
import {
  Button,
  Chip,
  Figure,
  FreshnessChip,
  HexGauge,
  Interlude,
  Kbd,
  LinkButton,
  Meter,
  Panel,
  Section,
  SectionHeader,
  Segmented,
  Sources,
  Stat,
  Switch,
  ToastProvider,
  Tooltip,
  useToast,
} from '@/ui';

applyStoredMotion();

type Loader = () => Promise<{ default: ComponentType }>;

/** One lazy loader per real chapter: an import that fails only fails that chapter. */
const SECTIONS: Record<string, Loader> = {
  fragile: () => import('@/sections/FragileCloud').then((m) => ({ default: m.FragileCloud })),
  kubernetes: () => import('@/sections/FluxKubernetes').then((m) => ({ default: m.FluxKubernetes })),
  lifecycle: () => import('@/sections/Lifecycle').then((m) => ({ default: m.Lifecycle })),
  depin: () => import('@/sections/DepinGap').then((m) => ({ default: m.DepinGap })),
  takedown: () => import('@/sections/TakeItDown').then((m) => ({ default: m.TakeItDown })),
  operators: () => import('@/sections/Operators').then((m) => ({ default: m.Operators })),
  sealed: () => import('@/sections/Sealed').then((m) => ({ default: m.Sealed })),
  arena: () => import('@/sections/Arena').then((m) => ({ default: m.Arena })),
  cost: () => import('@/sections/Cost').then((m) => ({ default: m.Cost })),
  ecosystem: () => import('@/sections/Ecosystem').then((m) => ({ default: m.Ecosystem })),
  proof: () => import('@/sections/LiveProof').then((m) => ({ default: m.LiveProof })),
  join: () => import('@/sections/Join').then((m) => ({ default: m.Join })),
};

const SOURCES: Source[] = [
  { label: 'Flux public API', url: 'https://api.runonflux.io', accessed: '2026-10-24' },
  { label: 'Flux Atlas', url: 'https://atlas.app.runonflux.io', accessed: '2026-10-24' },
];

const LEDE =
  'Kubernetes keeps containers alive with a control plane. Flux keeps them alive with a blockchain and nodes that pick up work on their own.';

function Specimen({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: '0.75rem', paddingBlock: '1.25rem', borderBlockStart: '1px solid var(--line-1)' }}>
      <p style={{ margin: 0, color: 'var(--text-4)', font: '500 0.75rem/1 var(--font-sans)' }}>{name}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.25rem 1.75rem' }}>{children}</div>
    </div>
  );
}

function ToastDemo() {
  const { toast } = useToast();
  return (
    <>
      <Button size="sm" onClick={() => toast('Link copied', 'ok')}>
        Toast ok
      </Button>
      <Button size="sm" onClick={() => toast('Could not copy the link', 'crit')}>
        Toast crit
      </Button>
    </>
  );
}

const LAZY: Record<string, ComponentType> = Object.fromEntries(Object.entries(SECTIONS).map(([id, load]) => [id, lazy(load)]));

function OneSection({ id }: { id: string }) {
  const Chapter = LAZY[id];
  if (!Chapter) return <p style={{ padding: '6rem 2rem' }}>No section called {id}</p>;
  return (
    <Suspense fallback={null}>
      <Chapter />
    </Suspense>
  );
}

function Gallery() {
  const [seg, setSeg] = useState('a');
  const [on, setOn] = useState(true);
  const only = new URLSearchParams(window.location.search).get('section');
  if (only) {
    return (
      <ToastProvider>
        <Nav />
        <main id="main">
          <OneSection id={only} />
        </main>
        <Footer />
      </ToastProvider>
    );
  }
  return (
    <ToastProvider>
      <Nav />
      <main id="main">
        <Hero />

        <div id="g-interlude">
          <Interlude lines={['The cloud is', "someone else's computer"]} caption="So what happens when that computer is switched off?" />
        </div>

        <Section id="kubernetes" label="Header specimen">
          <div id="g-header">
            <SectionHeader num="02" eyebrow="A decentralized Kubernetes" title="A cloud that **schedules itself**" lede={LEDE} />
          </div>
          <div id="g-figure">
            <Figure
              fig="FIG 2.1"
              caption="Share of enterprise spending on cloud infrastructure services in the first quarter of 2026"
              aside={<Sources items={SOURCES} />}
            >
              <div style={{ display: 'grid', placeItems: 'center', minBlockSize: '14rem', color: 'var(--text-3)' }}>A visual lives here</div>
            </Figure>
          </div>
        </Section>

        <Section id="depin" label="Centered header specimen" pad="tight">
          <div id="g-center">
            <SectionHeader num="12" eyebrow="Join" title="Decentralized is not the same as **resilient**" lede="One short lede." align="center" />
          </div>
        </Section>

        <Section id="takedown" label="Panels and chips" pad="tight">
          <div id="g-panels" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))' }}>
            <Panel>
              <p className="t-h4">Glass panel</p>
              <p className="t-small">One hairline, a flat tint, nothing else</p>
            </Panel>
            <Panel variant="slab" tone="cumulus">
              <p className="t-h4">Slab, tier tone</p>
              <p className="t-small">The hairline takes the tier colour</p>
            </Panel>
            <Panel variant="ghost">
              <p className="t-h4">Ghost</p>
              <p className="t-small">The hairline only</p>
            </Panel>
            <Panel as="a" href="#top" interactive>
              <p className="t-h4">Interactive</p>
              <p className="t-small">Hover to firm up the hairline</p>
            </Panel>
            <Panel marks ruler="left">
              <p className="t-h4">Opt-in marks and ruler</p>
              <p className="t-small">Rare accents, never defaults</p>
            </Panel>
          </div>
        </Section>

        <Section id="kit" label="Kit specimens" pad="tight">
          <div id="g-kit">
            <Specimen name="Chip: plain text, an optional dot or icon">
              <Chip>Neutral</Chip>
              <Chip tone="accent" bullet>
                Accent
              </Chip>
              <Chip tone="ok" bullet="pulse">
                Live
              </Chip>
              <Chip tone="warn" bullet>
                Snapshot
              </Chip>
              <Chip tone="crit" bullet>
                Offline
              </Chip>
              <Chip tone="cumulus">Cumulus</Chip>
              <Chip tone="nimbus">Nimbus</Chip>
              <Chip tone="stratus">Stratus</Chip>
              <Chip tone="ok" icon={<Server size={14} aria-hidden="true" />} size="sm">
                Small with icon
              </Chip>
              <Chip tone="accent" solid>
                Heavier weight
              </Chip>
            </Specimen>
            <Specimen name="FreshnessChip">
              <FreshnessChip status="live" fetchedAt={new Date().toISOString()} />
              <FreshnessChip status="snapshot" fetchedAt="2026-10-20T08:00:00Z" />
              <FreshnessChip status="loading" />
            </Specimen>
            <Specimen name="Sources, Tooltip, Kbd, Toast">
              <Sources items={SOURCES} />
              <Tooltip content="A plain tooltip">
                <button type="button" style={{ color: 'var(--text-2)' }}>
                  Hover me
                </button>
              </Tooltip>
              <span style={{ color: 'var(--text-3)' }}>
                Press <Kbd>Esc</Kbd> to close
              </span>
              <ToastDemo />
            </Specimen>
            <Specimen name="Buttons">
              <Button variant="primary">Primary</Button>
              <Button>Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <LinkButton href="#top" variant="primary" size="lg" iconEnd={<Download size={16} aria-hidden="true" />}>
                Large
              </LinkButton>
            </Specimen>
            <Specimen name="Segmented, Switch, Meter, HexGauge">
              <Segmented
                aria-label="Demo"
                value={seg}
                onChange={setSeg}
                options={[
                  { value: 'a', label: 'One' },
                  { value: 'b', label: 'Two' },
                  { value: 'c', label: 'Three' },
                ]}
              />
              <Switch checked={on} onChange={setOn}>
                A switch
              </Switch>
              <div style={{ inlineSize: '14rem' }}>
                <Meter value={0.72} label="Uptime" reading="99.7%" tone="ok" />
              </div>
              <HexGauge value={0.64} size={88} aria-label="Demo gauge">
                64
              </HexGauge>
            </Specimen>
            <Specimen name="Stat">
              <Stat label="Nodes online" value={6850} status="live" fetchedAt={new Date().toISOString()} size="md" />
              <Stat label="Countries" value={57} asOf="2026-10-24" size="md" />
            </Specimen>
          </div>
        </Section>
      </main>
      <Footer />
    </ToastProvider>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('missing #root');
createRoot(root).render(
  <StrictMode>
    <Gallery />
  </StrictMode>,
);
