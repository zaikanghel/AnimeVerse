import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function AnimeCTA() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-16 bg-gray-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <img 
          src="https://images.unsplash.com/photo-1563991655280-cb95c90ca2fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600&q=80" 
          alt="Anime Background" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-sans mb-4">
            Your Favorite Anime, All in One Place
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Watch thousands of episodes with new titles added regularly. No ads, no interruptions, just pure anime enjoyment.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              className="px-8 py-3 bg-accent hover:bg-accent/90 rounded-md transition duration-200 font-medium"
              onClick={() => setLocation('/explore')}
            >
              Get Started
            </Button>
            <Button 
              variant="outline"
              className="px-8 py-3 bg-gray-800 border border-white hover:bg-gray-700 rounded-md transition duration-200 font-medium"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
