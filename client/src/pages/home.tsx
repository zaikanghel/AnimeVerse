import { useEffect } from 'react';
import HeroSlider from '@/components/hero-slider';
import GenreFilter from '@/components/genre-filter';
import TrendingAnime from '@/components/trending-anime';
import RecentlyAdded from '@/components/recently-added';
import TopRated from '@/components/top-rated';
import AnimeCTA from '@/components/anime-cta';

export default function Home() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="pt-16">
      <HeroSlider />
      <GenreFilter />
      <TrendingAnime />
      <RecentlyAdded />
      <TopRated />
      <AnimeCTA />
    </main>
  );
}
