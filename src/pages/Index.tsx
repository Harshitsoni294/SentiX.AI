import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Newspaper, Share2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Feature = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="rounded-lg border p-6 hover-scale">
    <div className="flex items-center gap-3 mb-3">
      <Icon className="text-accent" />
      <h3 className="font-semibold text-lg">{title}</h3>
    </div>
    <p className="text-muted-foreground">{desc}</p>
  </div>
);

const Index = () => {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-transparent to-brand2/20" aria-hidden="true" />
        <div className="container py-20 md:py-28 relative z-10">
          <header className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">India Trending News to Instagram</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Fetch trending Indian news from Reddit, auto-generate Instagram-ready posts on a beautiful template, then download or share.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild variant="hero" className="hover-scale">
                <Link to="/service">Use the Service <ArrowRight /></Link>
              </Button>
              <a href="#how" className="story-link">Learn how it works</a>
            </div>
          </header>
        </div>
      </section>

      <section id="what" className="container py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">What we do</h2>
        <p className="text-muted-foreground max-w-3xl mb-6">
          We streamline your content workflow: discover, curate, and share. Our tool fetches top Indian news posts and most upvoted comments, composes a crisp image with headline and summary, and gets it ready for Instagram.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Feature icon={Newspaper} title="Trending from Reddit" desc="Pulls hot posts from curated Indian subreddits." />
          <Feature icon={Sparkles} title="Auto Design" desc="Overlays headline and summary on a premium template." />
          <Feature icon={Share2} title="Share Faster" desc="Download instantly or post to Instagram after auth." />
        </div>
      </section>

      <section id="how" className="bg-muted/30 py-12 md:py-16">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">How it works</h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["Get trending posts", "Pick a story", "Preview & share"].map((step, i) => (
              <li key={i} className="rounded-lg border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="text-accent" />
                  <span className="font-semibold">Step {i + 1}</span>
                </div>
                <p className="text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <Button asChild variant="hero" className="hover-scale">
              <Link to="/service">Get Trending Posts <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-10">
        <p className="text-sm text-muted-foreground">Mobile-friendly, smooth animations, and clean workflow.</p>
      </section>
    </main>
  );
};

export default Index;
