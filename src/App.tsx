import { Footer } from '@/shell/Footer';
import { chapter, LazySection } from '@/shell/LazySection';
import { Nav } from '@/shell/Nav';
import { Interlude, ToastProvider } from '@/ui';

// Each chapter is its own chunk (see shell/LazySection): one broken chapter never blanks the page.
const Hero = chapter(() => import('@/sections/Hero'), 'Hero');
const FragileCloud = chapter(() => import('@/sections/FragileCloud'), 'FragileCloud');
const FluxKubernetes = chapter(() => import('@/sections/FluxKubernetes'), 'FluxKubernetes');
const Lifecycle = chapter(() => import('@/sections/Lifecycle'), 'Lifecycle');
const DepinGap = chapter(() => import('@/sections/DepinGap'), 'DepinGap');
const TakeItDown = chapter(() => import('@/sections/TakeItDown'), 'TakeItDown');
const Operators = chapter(() => import('@/sections/Operators'), 'Operators');
const Sealed = chapter(() => import('@/sections/Sealed'), 'Sealed');
const Arena = chapter(() => import('@/sections/Arena'), 'Arena');
const Cost = chapter(() => import('@/sections/Cost'), 'Cost');
const Ecosystem = chapter(() => import('@/sections/Ecosystem'), 'Ecosystem');
const LiveProof = chapter(() => import('@/sections/LiveProof'), 'LiveProof');
const Join = chapter(() => import('@/sections/Join'), 'Join');

/**
 * The page, in storyboard order (docs/DESIGN.md). Four acts: the problem, the idea, the proof, the
 * network. Interludes are the breaths between acts: a light setup line, a bold payoff, an optional
 * caption, no act numerals and no periods. Section ids come from sections/chapters.ts.
 */
export function App() {
  return (
    <ToastProvider>
      <a href="#main" className="sr-only-focusable skip">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <LazySection id="top" component={Hero} />

        <Interlude
          lines={['The cloud is', "someone else's computer"]}
          caption="So what happens when that computer is switched off?"
        />
        <LazySection id="fragile" component={FragileCloud} />

        <Interlude
          lines={['What if the cloud', 'had no center?']}
          caption="Same ideas as the biggest clouds, different owners"
        />
        <LazySection id="kubernetes" component={FluxKubernetes} />
        <LazySection id="lifecycle" component={Lifecycle} />
        <LazySection id="open" component={DepinGap} />

        <Interlude
          lines={['Enough talking', 'Break something']}
          caption="Then see who is running the nodes"
        />
        <LazySection id="takedown" component={TakeItDown} />
        <LazySection id="operators" component={Operators} />
        <LazySection id="sealed" component={Sealed} />
        <LazySection id="arena" component={Arena} />
        <LazySection id="cost" component={Cost} />

        <Interlude
          lines={["It's already", 'running']}
          caption="Live numbers, straight from the nodes"
        />
        <LazySection id="ecosystem" component={Ecosystem} />
        <LazySection id="proof" component={LiveProof} />
        <LazySection id="join" component={Join} />
      </main>
      <Footer />
    </ToastProvider>
  );
}
