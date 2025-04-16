import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function Footer() {
  const { toast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Subscribed!",
      description: "You have been subscribed to our newsletter.",
    });
    // Reset the form
    const form = e.target as HTMLFormElement;
    form.reset();
  };

  return (
    <footer className="bg-gray-950 py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <a href="/" className="flex items-center mb-4">
              <span className="text-2xl font-bold font-sans text-white">Anime<span className="text-accent">Verse</span></span>
            </a>
            <p className="text-gray-400 mb-4">Your gateway to the best anime experience online. Watch high-quality anime anytime, anywhere.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-accent transition duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-accent transition duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0110 4.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.934.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-accent transition duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 3.636a1 1 0 011.414 0L10 7.172l3.536-3.536a1 1 0 011.414 1.414L11.414 8.586l3.536 3.536a1 1 0 01-1.414 1.414L10 9.828l-3.536 3.536a1 1 0 01-1.414-1.414l3.536-3.536L5.05 5.05a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-accent transition duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Explore</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-400 hover:text-white transition duration-200">Home</a></li>
              <li><a href="/recently" className="text-gray-400 hover:text-white transition duration-200">Recently Added</a></li>
              <li><a href="/top-rated" className="text-gray-400 hover:text-white transition duration-200">Top Rated</a></li>
              <li><a href="/genres" className="text-gray-400 hover:text-white transition duration-200">Genres</a></li>
              <li><a href="/movies" className="text-gray-400 hover:text-white transition duration-200">Movies</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Help</h3>
            <ul className="space-y-2">
              <li><a href="/faq" className="text-gray-400 hover:text-white transition duration-200">FAQ</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-white transition duration-200">Contact Us</a></li>
              <li><a href="/terms" className="text-gray-400 hover:text-white transition duration-200">Terms of Service</a></li>
              <li><a href="/privacy" className="text-gray-400 hover:text-white transition duration-200">Privacy Policy</a></li>
              <li><a href="/dmca" className="text-gray-400 hover:text-white transition duration-200">DMCA</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Newsletter</h3>
            <p className="text-gray-400 mb-4">Subscribe to get updates on new releases and features.</p>
            <form className="mb-4" onSubmit={handleSubscribe}>
              <div className="flex">
                <Input 
                  type="email" 
                  placeholder="Your email" 
                  className="bg-gray-800 border-none focus:ring-1 focus:ring-secondary w-full rounded-r-none"
                  required
                />
                <Button 
                  type="submit"
                  className="bg-secondary hover:bg-secondary/90 px-4 py-2 rounded-l-none"
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </form>
            <p className="text-xs text-gray-500">By subscribing you agree to our terms and privacy policy.</p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">© 2023 AnimeVerse. All rights reserved.</p>
          <div className="flex space-x-4">
            <a href="/terms" className="text-gray-500 hover:text-white text-sm transition duration-200">Terms</a>
            <a href="/privacy" className="text-gray-500 hover:text-white text-sm transition duration-200">Privacy</a>
            <a href="/cookies" className="text-gray-500 hover:text-white text-sm transition duration-200">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
