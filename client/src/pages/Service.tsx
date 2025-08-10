import { useCallback, useEffect, useRef, useState } from "react";
import { FaReddit, FaWhatsapp } from 'react-icons/fa';
import {
  Download, RefreshCw, Edit, Image as ImageIcon, Trash2, Share2,
  X, Upload, Palette, Sparkles, TrendingUp, Users,
  MessageSquare, Star, Globe, Instagram, Facebook,
  Send, Code, Zap, Crown, Gamepad2, Atom, DollarSign,
  Dumbbell, Film, BookOpen, MapPin
} from "lucide-react";

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

const TOPIC_SUBREDDITS: Record<string, { subs: string[], icon: any, color: string, description: string }> = {
  Technology: { subs: ["technology", "technews"], icon: Code, color: "from-blue-500 to-purple-600", description: "Latest tech news and innovations" },
  Gaming: { subs: ["gaming", "GameDeals"], icon: Gamepad2, color: "from-green-500 to-teal-600", description: "Gaming news, deals & discussions" },
  Science: { subs: ["science", "Physics"], icon: Atom, color: "from-cyan-500 to-blue-600", description: "Scientific discoveries & research" },
  "Finance & Investing": { subs: ["personalfinance", "investing"], icon: DollarSign, color: "from-yellow-500 to-orange-600", description: "Money management & investment tips" },
  "Fitness & Health": { subs: ["fitness", "nutrition"], icon: Dumbbell, color: "from-red-500 to-pink-600", description: "Health, fitness & wellness" },
  "Movies & TV": { subs: ["movies", "television"], icon: Film, color: "from-purple-500 to-indigo-600", description: "Entertainment & media content" },
  "Books & Literature": { subs: ["books", "literature"], icon: BookOpen, color: "from-emerald-500 to-green-600", description: "Literary discussions & reviews" },
  "India News & Culture": { subs: ["Indianews", "India"], icon: MapPin, color: "from-orange-500 to-red-600", description: "Indian news, culture & discussions" },
};

const POSTS_PER_TOPIC = 6;    // user asked for 6 posts
const COMMENTS_PER_POST = 9;  // user asked for ~8-9 top comments

const Service = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [selected, setSelected] = useState<RedditPost | null>(null);
  const [editableTitle, setEditableTitle] = useState("");
  const [editableDescription, setEditableDescription] = useState("");
  const [modelReply, setModelReply] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------- Real Reddit Fetch --------------------
  // Fetch function: for given subs array, fetch posts (hot) and for each post fetch top N comments.
  const fetchRedditPosts = useCallback(async (subs: string[]) => {
    setIsLoading(true);
    setSelected(null);
    setPosts([]);
    setModelReply(null);
    setBgImageUrl(null);
    setFetchError(null);

    try {
      // For speed: fetch hot lists from all subs in parallel
      const subResponses = await Promise.allSettled(
        subs.map(sub =>
          fetch(`https://www.reddit.com/r/${encodeURIComponent(sub)}/hot.json?limit=12`)
            .then(res => {
              if (!res.ok) throw new Error(`Failed to fetch /r/${sub}`);
              return res.json();
            })
        )
      );

      // Aggregate candidate posts
      const candidates: any[] = [];
      subResponses.forEach((r, idx) => {
        if (r.status === "fulfilled") {
          const json = r.value;
          const children = json?.data?.children || [];
          children.forEach((c: any) => {
            const p = c.data;
            // filter out stickied and NSFW
            if (!p || p.stickied || p.over_18) return;
            candidates.push(p);
          });
        } else {
          // ignore failed sub fetch but remember error
          console.warn("Sub fetch failed:", subs[idx], (r as any).reason);
        }
      });

      if (candidates.length === 0) {
        setFetchError("No posts found for this topic or Reddit is unreachable.");
        setPosts([]);
        return;
      }

      // sort candidates by score descending and pick top POSTS_PER_TOPIC
      candidates.sort((a, b) => (b.score || 0) - (a.score || 0));
      const selectedCandidates = candidates.slice(0, POSTS_PER_TOPIC);

      // For each post, fetch comments in parallel
      const postPromises = selectedCandidates.map(async (p: any) => {
        try {
          // Fetch the comments JSON for the post
          const commentsRes = await fetch(`https://www.reddit.com${p.permalink}.json?limit=${COMMENTS_PER_POST}`);
          const commentsJson = await commentsRes.json();

          // Top-level comments are in commentsJson[1].data.children
          const rawComments = commentsJson?.[1]?.data?.children || [];

          // Filter to real comments (kind === 't1') and ignore "more" entries
          const topComments = rawComments
            .filter((c: any) => c && c.kind === "t1" && c.data && c.data.body)
            .slice(0, COMMENTS_PER_POST)
            .map((c: any) => ({
              body: c.data.body,
              score: c.data.score || 0,
            })) as RedditComment[];

          const post: RedditPost = {
            id: p.id,
            title: p.title,
            selftext: p.selftext || "",
            permalink: p.permalink,
            url: p.url,
            score: p.score || 0,
            subreddit: p.subreddit,
            comments: topComments,
          };
          return post;
        } catch (err) {
          // If comments fetch fails, still return post with empty comments
          console.warn("Comments fetch failed for", p.permalink, err);
          return {
            id: p.id,
            title: p.title,
            selftext: p.selftext || "",
            permalink: p.permalink,
            url: p.url,
            score: p.score || 0,
            subreddit: p.subreddit,
            comments: [],
          } as RedditPost;
        }
      });

      const postsResult = await Promise.allSettled(postPromises);
      const finalPosts: RedditPost[] = postsResult
        .filter(s => s.status === "fulfilled")
        .map((s: any) => s.value);

      // Final sort by score (descending)
      finalPosts.sort((a, b) => b.score - a.score);

      setPosts(finalPosts);
    } catch (err: any) {
      console.error("Error loading Reddit posts:", err);
      setFetchError(String(err?.message || err));
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // -------------------- Selection effect for editable fields & canvas --------------------
  useEffect(() => {
    if (selected) {
      setEditableTitle(selected.title);
      setEditableDescription(selected.selftext?.slice(0, 480) ?? "");
      setModelReply(null);
    }
  }, [selected]);

  // Canvas drawing effect (kept from your original)
  useEffect(() => {
    if (!selected) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 1080;
    canvas.width = size;
    canvas.height = size;

    const bg = new window.Image();
    bg.crossOrigin = "anonymous";
    bg.src = bgImageUrl || "/template.png";
    bg.onload = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(bg, 0, 0, size, size);

      // Overlay for readability
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const padding = 80;
      const contentWidth = size - padding * 2;

      const wrapText = (text: string, maxWidth: number, lineHeight: number, yStart: number) => {
        const words = text.split(" ");
        const lines: string[] = [];
        let current = "";
        for (let w of words) {
          const testLine = current ? current + " " + w : w;
          if (ctx.measureText(testLine).width > maxWidth && current) {
            lines.push(current);
            current = w;
          } else {
            current = testLine;
          }
        }
        if (current) lines.push(current);
        lines.forEach((line, i) => {
          ctx.fillText(line, size / 2, yStart + i * lineHeight);
        });
        return yStart + lines.length * lineHeight;
      };

      // Draw title
      let titleFontSize = 64;
      ctx.font = `700 ${titleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`;
      while (ctx.measureText(editableTitle).width > contentWidth && titleFontSize > 36) {
        titleFontSize -= 2;
        ctx.font = `700 ${titleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`;
      }
      let y = wrapText(editableTitle, contentWidth, titleFontSize * 1.2, padding);

      // Draw description
      const descFontSize = 36;
      ctx.font = `400 ${descFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      y += 32;
      wrapText(editableDescription, contentWidth, descFontSize * 1.4, y);

      // Footer branding
      ctx.font = `600 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.textAlign = "left";
      ctx.fillText("", padding, size - padding);
      ctx.textAlign = "right";
      ctx.fillText(`r/${selected.subreddit}`, size - padding, size - padding);
    };
    bg.onerror = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, size, size);
    };
  }, [editableTitle, editableDescription, selected, bgImageUrl]);

  // -------------------- Handlers --------------------
  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setPosts([]);
    setSelected(null);
    setModelReply(null);
    setBgImageUrl(null);
    const subs = TOPIC_SUBREDDITS[topic].subs;
    fetchRedditPosts(subs);
  };

  const handleRewriteAI = async () => {
    if (!selected) return;
    setIsRewriting(true);

    const topic = selectedTopic || "General";
    const desc = editableDescription;
    const comments = (selected.comments?.map(c => c.body).join(' | ') || "");

    const rephraseReq = {
      content: `Act as a professional social media content creator. Rewrite the content below into EXACTLY 4 lines. Generate only description in the output.\n- Keep it concise, impactful, and easy to read.\n- No bullet points or numbering.\n- Avoid emojis and hashtags.\n- Each line should be a short sentence or phrase.\n\nTopic: ${topic}\nDescription: ${desc}\nComments: ${comments}`
    };

    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE;
      const resp = await fetch(`${API_BASE}/rephrase/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rephraseReq)
      });
      if (!resp.ok) throw new Error('Server error');
      const data = await resp.json();
      setModelReply(data.rephrased || "No response from AI.");
    } catch (err) {
      setModelReply("AI service error: " + (err as any).message);
    }
    setIsRewriting(false);
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBgImageUrl(url);
    setShowBgModal(false);
  };

  const handleDownload = (format: string) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let mimeType = 'image/png';
    let extension = 'png';
    if (['jpg', 'jpeg'].includes(format)) {
      mimeType = 'image/jpeg';
      extension = format;
    }
    const link = document.createElement("a");
    link.download = `reddit-post.${extension}`;
    link.href = canvas.toDataURL(mimeType, 0.95);
    link.click();
    setShowDownloadModal(false);
  };

  const handleShare = (platform: string) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const shareText = `Check out this trending post: ${editableTitle}`;
      const url = window.location.href;
      switch (platform) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + url)}`, '_blank');
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
          break;
        case 'telegram':
          window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`, '_blank');
          break;
        case 'reddit':
          window.open(`https://reddit.com/submit?title=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`, '_blank');
          break;
        case 'instagram':
          navigator.clipboard.writeText(shareText + ' ' + url);
          alert('Content copied to clipboard! Paste it on Instagram.');
          break;
        case 'native':
          if (navigator.share) {
            navigator.share({ title: editableTitle, text: shareText, url });
          } else {
            navigator.clipboard.writeText(shareText + ' ' + url);
            alert('Link copied to clipboard!');
          }
          break;
      }
    });
    setShowShareModal(false);
  };

  const handleClear = () => {
    setSelected(null);
    setPosts([]);
    setModelReply(null);
    setBgImageUrl(null);
    setEditableTitle("");
    setEditableDescription("");
    setSelectedTopic(null);
    setFetchError(null);
  };

  // ------------------------------- RENDER ----------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-800 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-900 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-fuchsia-900 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="text-center py-12 px-4">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-700 to-indigo-900 rounded-2xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              PostCraft.AI: AI Content Creator
            </h1>
          </div>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto leading-relaxed">
            Transform trending Reddit posts into stunning social media content. Choose your topic, customize your design, and create viral-worthy posts in seconds.
          </p>
          <div className="flex justify-center items-center gap-6 mt-8 text-purple-300">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>Trending Content</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>8 Categories</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span>AI-Powered</span>
            </div>
          </div>
        </header>

        <div className="container max-w-7xl mx-auto px-4 pb-12">
          {/* Topic Selector */}
          <section className="mb-12">
            <div className="backdrop-blur-xl bg-black/50 border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Choose Your Content Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(TOPIC_SUBREDDITS).map(([topic, config]) => {
                  const IconComponent = config.icon;
                  return (
                    <button
                      key={topic}
                      onClick={() => handleTopicSelect(topic)}
                      className={`group relative p-6 rounded-2xl border transition-all duration-300 hover:scale-105 ${
                        selectedTopic === topic
                          ? 'border-white/30 bg-white/10 shadow-xl'
                          : 'border-white/10 bg-black/15 hover:bg-black/20 hover:border-white/20'
                      }`}
                    >
                      <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${config.color} mb-4 group-hover:scale-110 transition-transform`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-bold text-white text-lg mb-2">{topic}</h3>
                      <p className="text-purple-200 text-sm">{config.description}</p>
                      {selectedTopic === topic && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Loading State */}
          {isLoading && (
            <div className="backdrop-blur-xl bg-black/60 border border-white/10 rounded-3xl p-12 text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-700 to-indigo-900 rounded-full mb-6 animate-spin">
                <RefreshCw className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Fetching Trending Posts</h3>
              <p className="text-purple-200">Analyzing the hottest content from Reddit...</p>
              <div className="mt-6 flex justify-center">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          )}

          {/* Fetch error */}
          {fetchError && (
            <div className="mb-8 text-center text-red-300">
              <strong>Error:</strong> {fetchError}
            </div>
          )}

          {/* Posts Grid */}
          {posts.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Trending Posts</h2>
              <div className="flex gap-6 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory">
                {posts.map(post => (
                  <div
                    key={post.id}
                    onClick={() => setSelected(post)}
                    className={`flex-none w-[340px] group cursor-pointer backdrop-blur-xl bg-black/20 border rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:bg-black/25 snap-start ${
                      selected?.id === post.id 
                        ? 'border-purple-400/50 bg-black/30 shadow-xl shadow-purple-500/20'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-200 rounded-full text-sm font-medium">
                        r/{post.subreddit}
                      </span>
                      <div className="flex items-center gap-1 text-orange-400">
                        <Star className="w-4 h-4" />
                        <span className="font-medium">{post.score.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-white text-lg mb-3 line-clamp-2 group-hover:text-purple-200 transition-colors">
                      {post.title}
                    </h3>
                    
                    <p className="text-purple-200/70 text-sm mb-4 line-clamp-3">
                      {post.selftext || "Click to view this trending post..."}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-cyan-400">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">{post.comments.length} comments</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          onClick={(e) => e.stopPropagation()}
                          href={`https://www.reddit.com${post.permalink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-xs font-semibold hover:opacity-90 transition-colors"
                        >
                          See on Reddit
                        </a>
                        {selected?.id === post.id && (
                          <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-full text-xs font-bold">
                            SELECTED
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Small preview of top comments (first 2) */}
                    {post.comments.length > 0 && (
                      <div className="mt-4 text-sm text-purple-200/75">
                        <strong className="text-white">Top comments:</strong>
                        <ul className="mt-2 space-y-2">
                          {post.comments.slice(0, 2).map((c, idx) => (
                            <li key={idx} className="line-clamp-2 text-sm">
                              “{c.body}” <span className="text-xs text-orange-300">({c.score})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Content Creator */}
          {selected && (
            <section className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Create Your Content</h2>
              
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Canvas Preview */}
                <div className="space-y-6">
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      className="w-full aspect-square rounded-2xl shadow-2xl border border-white/20"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <div className="px-3 py-1 bg-black/70 text-white rounded-full text-sm backdrop-blur-sm">
                        Preview
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-6">
                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleRewriteAI}
                      disabled={isRewriting}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-800 to-indigo-900 text-white rounded-xl font-semibold hover:from-purple-900 hover:to-indigo-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRewriting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          AI Writing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          AI Rewrite
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-black/20 text-white rounded-xl font-semibold hover:bg-black/30 transition-all border border-white/20"
                    >
                      <Edit className="w-5 h-5" />
                      Edit Content
                    </button>

                    <button
                      onClick={() => setShowBgModal(true)}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-black/20 text-white rounded-xl font-semibold hover:bg-black/30 transition-all border border-white/20"
                    >
                      <Palette className="w-5 h-5" />
                      Background
                    </button>

                    <button
                      onClick={() => setShowDownloadModal(true)}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-700 to-green-900 text-white rounded-xl font-semibold hover:from-green-800 hover:to-green-950 transition-all"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-900 to-indigo-900 text-white rounded-xl font-semibold hover:from-cyan-950 hover:to-indigo-950 transition-all"
                    >
                      <Share2 className="w-5 h-5" />
                      Share
                    </button>

                    <button
                      onClick={handleClear}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-black/20 text-white rounded-xl font-semibold hover:bg-black/30 transition-all border border-white/20"
                    >
                      <Trash2 className="w-5 h-5" />
                      Clear
                    </button>
                  </div>

                  {/* Post Info */}
                  <div className="bg-black/30 rounded-xl p-6 border border-white/20">
                    <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Post Information
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-200">Subreddit:</span>
                        <span className="text-white font-medium">r/{selected.subreddit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-200">Score:</span>
                        <span className="text-orange-400 font-medium">{selected.score.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-200">Comments:</span>
                        <span className="text-cyan-400 font-medium">{selected.comments.length}</span>
                      </div>
                      <div className="pt-2">
                        <a
                          href={`https://www.reddit.com${selected.permalink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm"
                        >
                          See on Reddit
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* AI Response */}
                  {modelReply && (
                    <div className="bg-gradient-to-r from-purple-800/20 to-indigo-900/20 rounded-xl p-6 border border-purple-400/30">
                      <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        AI Enhanced Content
                      </h4>
                      <div className="text-purple-100 leading-relaxed whitespace-pre-line">
                        {modelReply}
                      </div>
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => setEditableDescription(modelReply)}
                          className="px-4 py-2 bg-gradient-to-r from-green-700 to-green-900 text-white rounded-lg font-semibold hover:from-green-800 hover:to-green-950 transition-all"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => { setEditableDescription(modelReply); setShowEditModal(true); }}
                          className="px-4 py-2 bg-black/30 text-white rounded-lg font-semibold hover:bg-black/40 transition-all border border-white/20"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-950 to-gray-900 border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Edit className="w-6 h-6" />
                  Edit Content
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-purple-200 font-medium mb-3">Title</label>
                  <input
                    type="text"
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                    placeholder="Enter your title..."
                  />
                </div>
                <div>
                  <label className="block text-purple-200 font-medium mb-3">Description</label>
                  <textarea
                    value={editableDescription}
                    onChange={(e) => setEditableDescription(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all resize-none"
                    placeholder="Enter your description..."
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-800 to-indigo-900 text-white rounded-xl font-semibold hover:from-purple-900 hover:to-indigo-950 transition-all"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 bg-black/30 text-white rounded-xl font-semibold hover:bg-black/40 transition-all border border-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Background Modal */}
        {showBgModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-950 to-gray-900 border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Palette className="w-6 h-6" />
                  Change Background
                </h3>
                <button
                  onClick={() => setShowBgModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="border-2 border-dashed border-white/30 rounded-xl p-8 hover:border-white/50 transition-colors">
                    <Upload className="w-12 h-12 text-white/50 mx-auto mb-4" />
                    <p className="text-white mb-4">Upload your custom background</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundChange}
                      className="hidden"
                      id="bg-upload"
                    />
                    <label
                      htmlFor="bg-upload"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-900 to-indigo-900 text-white rounded-xl font-semibold hover:from-cyan-950 hover:to-indigo-950 transition-all cursor-pointer"
                    >
                      <ImageIcon className="w-5 h-5" />
                      Choose Image
                    </label>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowBgModal(false)}
                    className="flex-1 px-6 py-3 bg-black/30 text-white rounded-xl font-semibold hover:bg-black/40 transition-all border border-white/20"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Download Modal */}
        {showDownloadModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-950 to-gray-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Download className="w-6 h-6" />
                  Download Format
                </h3>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="space-y-3">
                {['PNG', 'JPG', 'JPEG'].map((format) => (
                  <button
                    key={format}
                    onClick={() => handleDownload(format.toLowerCase())}
                    className="w-full p-4 bg-black/20 hover:bg-black/25 border border-white/20 text-white rounded-xl font-semibold transition-all text-left flex items-center justify-between"
                  >
                    <span>{format} Format</span>
                    <Download className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-950 to-gray-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Share2 className="w-6 h-6" />
                  Share Content
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'WhatsApp', platform: 'whatsapp', color: 'from-green-800 to-green-700', icon: FaWhatsapp },
                  { name: 'Facebook', platform: 'facebook', color: 'from-blue-900 to-blue-700', icon: Facebook },
                  { name: 'Instagram', platform: 'instagram', color: 'from-pink-800 to-purple-800', icon: Instagram },
                  { name: 'Telegram', platform: 'telegram', color: 'from-cyan-800 to-blue-800', icon: Send },
                  { name: 'Reddit', platform: 'reddit', color: 'from-orange-800 to-red-800', icon: FaReddit },
                  { name: 'Native Share', platform: 'native', color: 'from-gray-700 to-gray-600', icon: Share2 }
                ].map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <button
                      key={social.platform}
                      onClick={() => handleShare(social.platform)}
                      className={`p-4 bg-gradient-to-r ${social.color} text-white rounded-xl font-semibold hover:scale-105 transition-all flex flex-col items-center gap-2`}
                    >
                      <IconComponent className="w-6 h-6" />
                      <span className="text-sm">{social.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-12 px-4 border-t border-white/10 mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center items-center gap-4 mb-6">
              <div className="p-2 bg-gradient-to-r from-purple-700 to-indigo-900 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">PostCraft.AI</h3>
            </div>
            <p className="text-purple-200 mb-6">
              Transforming Reddit's best content into stunning social media posts with the power of AI.
            </p>
            <div className="flex justify-center items-center gap-8 text-purple-300">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">8</div>
                <div className="text-sm">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">∞</div>
                <div className="text-sm">Possibilities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">AI</div>
                <div className="text-sm">Powered</div>
              </div>
            </div>
            <div className="mt-8 text-purple-300/70 text-sm">
              Made with ❤️ for content creators everywhere
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Service;
