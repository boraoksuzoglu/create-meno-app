import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/landing/Hero';
import { TechStrip } from '@/components/landing/TechStrip';
import { ConfigBuilder } from '@/components/landing/ConfigBuilder';
import { AiFriendly } from '@/components/landing/AiFriendly';
import { DocsGenerator } from '@/components/landing/DocsGenerator';
import { Architecture } from '@/components/landing/Architecture';
import { CodeShowcase } from '@/components/landing/CodeShowcase';
import { FeatureMatrix } from '@/components/landing/FeatureMatrix';
import { Cta } from '@/components/landing/Cta';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TechStrip />
        <ConfigBuilder />
        <AiFriendly />
        <DocsGenerator />
        <Architecture />
        <CodeShowcase />
        <FeatureMatrix />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
