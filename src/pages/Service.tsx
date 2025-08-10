import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingScreen from "@/components/LoadingScreen";

import { toast } from "sonner";

interface RedditComment {
  body: string;
  score: number;
}

interface RedditPost {
  id: string;
  title: string;
  selftext?: string;
  permalink: string;
  url?: string;
  score: number;
  subreddit: string;
  comments: RedditComment[];
}

const DEFAULT_SUBREDDITS = ["india", "Indianews", "IndiaSpeaks"]; // can be customized

const Service = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [selected, setSelected] = useState<RedditPost | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const subreddits = DEFAULT_SUBREDDITS;
        const allPosts: RedditPost[] = [] as RedditPost[];
        for (const sub of subreddits) {
          const res = await fetch(`https://www.reddit.com/r/${encodeURIComponent(sub)}/hot.json?limit=8`);
          const json = await res.json();
          const children = json?.data?.children || [];
          const posts = children
            .map((c: any) => c.data)
            .filter((p: any) => !p.stickied && !p.over_18)
            .map((p: any) => ({
              id: p.id,
              title: p.title,
              selftext: p.selftext || "",
              permalink: p.permalink,
              url: p.url,
              score: p.score,
              subreddit: p.subreddit,
              comments: [] as RedditComment[],
            }));
          allPosts.push(...(posts as RedditPost[]));
        }
        const unique = Array.from(new Map(allPosts.map((p) => [p.id, p])).values())
          .sort((a, b) => b.score - a.score)
          .slice(0, 6);

        const withComments: RedditPost[] = [];
        for (const p of unique) {
          const resC = await fetch(`https://www.reddit.com/comments/${p.id}.json?limit=50`);
          const jsonC = await resC.json();
          const comments = (jsonC?.[1]?.data?.children || [])
            .map((c: any) => c.data)
            .filter((c: any) => c && !c.stickied && !(c.body || "").includes("I am a bot"))
            .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
            .slice(0, 6)
            .map((c: any) => ({ body: c.body || "", score: c.score || 0 }));
          withComments.push({ ...p, comments });
        }
        setPosts(withComments);
      } catch (e) {
        console.error(e);
        toast.error("Failed to fetch Reddit trends");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const description = useMemo(() => {
    if (!selected) return "";
    const text = selected.selftext || "";
    if (text.length > 240) return text.slice(0, 240) + "…";
    return text;
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const template = new Image();
    template.src = "/template.png";
    template.onload = () => {
      const size = 1080; // Instagram square
      canvas.width = size;
      canvas.height = size;

      // Draw template
      ctx.drawImage(template, 0, 0, size, size);

      // Overlay with semi-transparent scrim for readability
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, size, size);

      // Typography
      const padding = 80;
      const contentWidth = size - padding * 2;

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const title = selected.title;
      let titleFontSize = 64;
      ctx.font = `700 ${titleFontSize}px Inter, ui-sans-serif`;
      const wrapText = (text: string, maxWidth: number, lineHeight: number, startY: number) => {
        const words = text.split(" ");
        const lines: string[] = [];
        let current = words[0] || "";
        for (let i = 1; i < words.length; i++) {
          const test = current + " " + words[i];
          const metrics = ctx.measureText(test);
          if (metrics.width > maxWidth) {
            lines.push(current);
            current = words[i];
          } else {
            current = test;
          }
        }
        lines.push(current);
        lines.forEach((line, idx) => {
          ctx.fillText(line, size / 2, startY + idx * lineHeight);
        });
        return startY + lines.length * lineHeight;
      };

      // Shrink title font if needed
      while (ctx.measureText(title).width > contentWidth && titleFontSize > 36) {
        titleFontSize -= 2;
        ctx.font = `700 ${titleFontSize}px Inter, ui-sans-serif`;
      }
      let y = wrapText(title, contentWidth, titleFontSize * 1.2, padding + 40);

      // Description
      const descFontSize = 36;
      ctx.font = `400 ${descFontSize}px Inter, ui-sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      y += 32;
      y = wrapText(description || "", contentWidth, descFontSize * 1.4, y);

      // Footer branding
      ctx.font = `600 28px Inter, ui-sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "left";
      ctx.fillText("India Trending News", padding, size - padding);
      ctx.textAlign = "right";
      ctx.fillText(`r/${selected.subreddit}`, size - padding, size - padding);
    };
  }, [selected, description]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "india-trending-post.png";
    link.href = url;
    link.click();
  };

  const handlePostInstagram = async () => {
    toast.info("Instagram posting requires authentication; we'll guide you to connect your account soon.");
  };

  return (
    <main className="container py-10">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">India Trending News to Instagram</h1>
        <p className="text-muted-foreground mt-2">Fetch, preview, download, and share top Indian news posts.</p>
      </header>

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-enter">
          {posts.map((p) => (
            <Card key={p.id} className="hover-scale">
              <CardHeader>
                <CardTitle className="line-clamp-3">{p.title}</CardTitle>
                <CardDescription>r/{p.subreddit} • Score {p.score}</CardDescription>
              </CardHeader>
              <CardContent>
                {p.selftext && (
                  <p className="text-sm text-muted-foreground line-clamp-4">{p.selftext}</p>
                )}
                {p.comments?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Top comments:</p>
                    <ul className="space-y-1">
                      {p.comments.slice(0, 5).map((c, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          • {c.body.slice(0, 120)}{c.body.length > 120 ? "…" : ""} <span className="text-xs">(↑{c.score})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <a href={`https://www.reddit.com${p.permalink}`} target="_blank" rel="noreferrer">View on Reddit</a>
                </Button>
                <Button variant="hero" onClick={() => setSelected(p)}>Select</Button>
              </CardFooter>
            </Card>
          ))}
        </section>
      )}

      {selected && (
        <section className="mt-10 animate-enter">
          <h2 className="text-2xl font-semibold mb-4">Preview</h2>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <canvas ref={canvasRef} className="rounded-lg shadow-elegant" aria-label="Instagram post preview" />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setSelected(null)}>Clear</Button>
              <Button onClick={handleDownload}>Download</Button>
              <Button variant="hero" onClick={handlePostInstagram}>Share to Instagram</Button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default Service;
