import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download, RefreshCw, Edit, Palette, Sparkles, TrendingUp, Users,
  MessageSquare, Star, Globe, Instagram, Facebook, Send, Code, Zap, Gamepad2,
  Atom, DollarSign, Dumbbell, Film, BookOpen, MapPin, FileText, Share2, X
} from "lucide-react";
import { FaReddit, FaWhatsapp } from 'react-icons/fa';
import jsPDF from "jspdf"; // Change 1: import jsPDF for proper PDF generation


// ------------------------------------
// TYPE DEFINITIONS & UTILITIES
// ------------------------------------


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


// Topic mapping: add/remove per your needs!
const TOPIC_SUBREDDITS: Record<
  string,
  { subs: string[]; icon: any; color: string; description: string }
> = {
  Technology: { subs: ["tesla", "teslaindia"], icon: Code, color: "from-blue-500 to-purple-600", description: "Latest tech news and innovations" },
  Gaming: { subs: ["gaming", "GameDeals"], icon: Gamepad2, color: "from-green-500 to-teal-600", description: "Gaming news, deals & discussions" },
  Science: { subs: ["science", "Physics"], icon: Atom, color: "from-cyan-500 to-blue-600", description: "Scientific discoveries & research" },
  "Finance & Investing": { subs: ["personalfinance", "investing"], icon: DollarSign, color: "from-yellow-500 to-orange-600", description: "Money management & investment tips" },
  "Fitness & Health": { subs: ["fitness", "nutrition"], icon: Dumbbell, color: "from-red-500 to-pink-600", description: "Health, fitness & wellness" },
  "Movies & TV": { subs: ["movies", "television"], icon: Film, color: "from-purple-500 to-indigo-600", description: "Entertainment & media content" },
  "Books & Literature": { subs: ["books", "literature"], icon: BookOpen, color: "from-emerald-500 to-green-600", description: "Literary discussions & reviews" },
  "India News & Culture": { subs: ["Indianews", "India"], icon: MapPin, color: "from-orange-500 to-red-600", description: "Indian news, culture & discussions" },
};


const POSTS_PER_TOPIC = 15;
const COMMENTS_PER_POST = 9;


// ------------------------------------
// MAIN FUNCTIONAL COMPONENT
// ------------------------------------


const Service = () => {
  // STATE
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);


  const [mergedVisible, setMergedVisible] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);


  const [showShareModal, setShowShareModal] = useState(false);

  // Change 3: state for expanded merged card
  const [mergedExpanded, setMergedExpanded] = useState(false);


  // .env
  const PROXY_BASE = (import.meta as any).env?.VITE_REDDIT_PROXY_BASE || '';
  const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';


  // REDDIT FETCH (SAME AS BEFORE)
  const redditProxy = useCallback(async (path: string) => {
    const url = `${PROXY_BASE}/api/reddit${path}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
    return res.json();
  }, [PROXY_BASE]);


  const fetchRedditPosts = useCallback(
    async (subs: string[]) => {
      setIsLoading(true);
      setMergedVisible(false);
      setAiText(null);
      setPdfUrl(null);
      setFetchError(null);
      try {
        const subResponses = await Promise.allSettled(
          subs.map((sub) =>
            redditProxy(`?mode=list&sub=${encodeURIComponent(sub)}&limit=12`)
          )
        );
        const candidates: any[] = [];
        subResponses.forEach((r, idx) => {
          if (r.status === "fulfilled") {
            const json = r.value as any;
            const children = Array.isArray(json?.data?.children)
              ? json.data.children
              : [];
            children.forEach((c: any) => {
              const p = c.data;
              if (!p || p.stickied || p.over_18) return;
              candidates.push(p);
            });
          }
        });
        if (candidates.length === 0) {
          setFetchError("No posts found for this topic or Reddit is unreachable.");
          setPosts([]);
          return;
        }
        candidates.sort((a, b) => (b.score || 0) - (a.score || 0));
        const selectedCandidates = candidates.slice(0, POSTS_PER_TOPIC);
        const postPromises = selectedCandidates.map(async (p: any) => {
          try {
            const perma = p.permalink?.replace(/\/+$/, "") || "";
            const commentsJson = await redditProxy(
              `?mode=comments&permalink=${encodeURIComponent(
                perma
              )}&limit=${COMMENTS_PER_POST}`
            );
            const rawComments = Array.isArray(commentsJson)
              ? commentsJson?.[1]?.data?.children || []
              : [];
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
          } catch {
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
          .filter((s) => s.status === "fulfilled")
          .map((s: any) => s.value);
        finalPosts.sort((a, b) => b.score - a.score);
        setPosts(finalPosts);
      } catch (err: any) {
        setFetchError(String(err?.message || err));
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [redditProxy]
  );


  // HANDLERS
  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setPosts([]); // Hide posts immediately
    // If topic is in TOPIC_SUBREDDITS, use its subreddits, else use topic as subreddit
    if (TOPIC_SUBREDDITS[topic]) {
      fetchRedditPosts(TOPIC_SUBREDDITS[topic].subs);
    } else {
      fetchRedditPosts([topic]);
    }
  };



  const handleProceed = () => {
    setMergedVisible(true);
    setAiText(null);
    setPdfUrl(null);
    setMergedExpanded(false);
  };


  // AI Rephrase
  const handleRewriteAI = async () => {
    if (!posts.length || !selectedTopic) return;
    setIsRewriting(true);
    setAiText(null);
    setPdfUrl(null);

    // Build merged card content as paragraph (same as UI)
    const mergedParagraph = posts.map((post, idx) => {
      let section = `${idx + 1}. ${post.title}\n`;
      if (post.selftext) section += post.selftext + '\n';
      section += `Subreddit: r/${post.subreddit} | Score: ${post.score}\n`;
      if (post.comments.length > 0) {
        section += 'Top comments:\n';
        section += post.comments.slice(0, 3).map((c, cidx) => `  - ${c.body} (${c.score})`).join('\n') + '\n';
      }
      return section;
    }).join('\n\n');

    const rephraseReq = {
      content: `Generate a 1-page sentiment analysis report from the following Reddit content. Start with a short introduction, then summarize positive sentiments (what users liked or valued) and negative sentiments (what users disliked or criticized), and end with a balanced conclusion. Make the writing professional, concise, and extra wonderful to read. Do not write any extra word other than report content.\n\n<paragraph>\n${mergedParagraph}\n</paragraph>`
    };

    try {
      const resp = await fetch(`${API_BASE}/rephrase/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rephraseReq)
      });
      if (!resp.ok) throw new Error('Server error');
      const data = await resp.json();
      const aiReport = data.rephrased || "No response from AI.";
      setAiText(aiReport);

      // Change 1: Proper PDF generation using jsPDF
      const pdf = new jsPDF();
      pdf.text(aiReport, 10, 10, { maxWidth: 180 });
      const blobUrl = pdf.output("bloburl");
      setPdfUrl(blobUrl);
    } catch (err: any) {
      // Log error for debugging fetch failures
      console.error("AI service error:", err);
      setAiText("AI service error: " + (err && err.message ? err.message : String(err)));
    }
    setIsRewriting(false);
  };


  // Download AI PDF
  function handleDownloadReport() {
    if (!aiText || !selectedTopic) return;
    // Change 1: use jsPDF to save PDF properly
    const pdf = new jsPDF();
    pdf.text(aiText, 10, 10, { maxWidth: 180 });
    pdf.save(`SentimentReport_${selectedTopic}.pdf`);
  }


  // Share logic
  function handleShare(platform: string) {
    if (!aiText) return;
    const shareText = `Sentiment analysis for ${selectedTopic}: ${aiText}`;
    const url = window.location.href;
    switch (platform) {
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText + " " + url)}`,
          "_blank"
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}`,
          "_blank"
        );
        break;
      case "telegram":
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(
            url
          )}&text=${encodeURIComponent(shareText)}`,
          "_blank"
        );
        break;
      case "reddit":
        window.open(
          `https://reddit.com/submit?title=${encodeURIComponent(
            shareText
          )}&url=${encodeURIComponent(url)}`,
          "_blank"
        );
        break;
      case "instagram":
        navigator.clipboard.writeText(shareText + " " + url);
        alert("Content copied to clipboard! Paste it on Instagram.");
        break;
      case "native":
        if (navigator.share) {
          navigator.share({ title: `Sentiment Report`, text: shareText, url });
        } else {
          navigator.clipboard.writeText(shareText + " " + url);
          alert("Link copied to clipboard!");
        }
        break;
    }
    setShowShareModal(false);
  }


  // -----------------------------------
  // RENDER
  // -----------------------------------


  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-950 via-black to-pink-950 text-white">



      {/* HEADER */}
      <header className="text-center py-12 px-4">
      <div className="flex flex-col items-center gap-2 mb-6">
  <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-300 to-indigo-300 bg-clip-text text-transparent">
    SentiX.AI
  </h1>
  <h2 className="text-lg font-semibold bg-gradient-to-r from-white via-purple-300 to-indigo-300 bg-clip-text text-transparent">
    S m a r t _ S e n t i m e n t _ A n a l y z e r
  </h2>
</div>

        <p className="text-xl text-purple-200 max-w-3xl mx-auto leading-relaxed">
        Turn raw social media discussions into crystal-clear sentiment reports. Instantly analyze trending posts, detect what people love or dislike, and uncover neutral takes.
        </p>
      </header>


      {/* TOPIC SELECTOR */}
      <section className="mb-12 max-w-7xl mx-auto">
        <div className="bg-transparent rounded-3xl p-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Choose or enter a company/organization to analyze sentiments</h2>
          <div className="grid grid-cols-3 sm:flex sm:flex-row justify-center items-center gap-6 mb-6">
            {[
              { name: 'Apple', logo: '/apple.png' },
              { name: 'Microsoft', logo: '/microsoft.png' },
              { name: 'Google', logo: '/google.png' },
              { name: 'Amazon', logo: '/amazon.png' },
              { name: 'Tesla', logo: '/tesla.png' },
              { name: 'Netflix', logo: '/netflix.png' },
            ].map((company) => (
              <button
                key={company.name}
                onClick={() => handleTopicSelect(company.name)}
                className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${selectedTopic === company.name ? 'bg-white/10 shadow-xl' : 'bg-transparent'}`}
                style={{ minWidth: 70 }}
              >
                {/* Replace src with correct path to logos in public folder */}
                <img src={company.logo} alt={company.name} className="mb-1 w-8 h-8 object-contain" />
                <span className="text-xs text-white font-medium">{company.name}</span>
              </button>
            ))}
          </div>
          {/* Search box */}
          <div className="flex justify-center">
            <div className="flex w-full max-w-md items-center bg-white rounded-xl shadow px-2 py-1">
              <input
                type="text"
                placeholder="Enter company name..."
                className="flex-1 px-3 py-2 bg-transparent text-black text-base focus:outline-none placeholder:text-gray-400"
                value={selectedTopic || ''}
                onChange={e => setSelectedTopic(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleTopicSelect(e.currentTarget.value || ''); }}
              />
              <button
                className="p-2 ml-2 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white flex items-center justify-center"
                onClick={() => handleTopicSelect(selectedTopic || '')}
                aria-label="Search"
              >
                {/* Use a search icon from your icon library, e.g. Lucide or Heroicons */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>


      {isLoading && (
        <div className="backdrop-blur-xl bg-black/60 border border-white/10 rounded-3xl p-12 text-center mb-12" style={{ width: '80vw', margin: '0 auto' }}>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-700 to-indigo-900 rounded-full mb-6 animate-spin">
            <RefreshCw className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Fetching content</h3>
          <p className="text-purple-200">Analyzing discussions from social media platforms...</p>
        </div>
      )}
      {fetchError && (
        <div className="mb-8 text-center text-red-300">
          <strong>Error:</strong> {fetchError}
        </div>
      )}


      {/* REDDIT CARDS (NOT SELECTABLE) */}
      {posts.length > 0 && (
        <section className="mb-8 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Latest Discussions</h2>
          <div className="flex gap-6 overflow-x-auto pb-2">
            {posts.map((post) => (
              <div
                key={post.id}
                // Change 2: fixed height 50vh + overflow-hidden + prevent text overflow horizontally
                className="flex-none w-[340px] h-[70vh] overflow-hidden p-6 rounded-2xl border border-white/10 bg-black/20"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-200 rounded-full text-sm font-medium">
                      r/{post.subreddit}
                    </span>
                    <div className="flex items-center gap-1 text-orange-400">
                      <Star className="w-4 h-4" />
                      <span className="font-medium">{post.score.toLocaleString()}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-white text-lg mb-3 flex-shrink-0">{post.title}</h3>
                  <p className="text-purple-200/70 text-sm mb-4 flex-grow overflow-hidden break-words">
                    {post.selftext || "No text available."}
                  </p>
                  <div className="flex items-center text-cyan-400 gap-2 flex-shrink-0">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">{post.comments.length} comments</span>
                  </div>
                  {post.comments.length > 0 && (
                    <div className="mt-4 text-sm text-purple-200/75 flex-shrink-0">
                      <strong className="text-white">Top comments:</strong>
                      <ul className="mt-2 space-y-2">
                        {post.comments.slice(0, 2).map((c, idx) => (
                          <li key={idx} className="line-clamp-2 text-sm break-words">
                            “{c.body}” <span className="text-xs text-orange-300">({c.score})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <button
              className="px-8 py-4 rounded-2xl bg-green-600 hover:bg-green-700 font-semibold text-white text-lg shadow-lg"
              onClick={handleProceed}
            >
              Merge All Data
            </button>
          </div>
        </section>
      )}


      {/* MERGED CARD */}
      {mergedVisible && posts.length > 0 && (
        <section className="max-w-3xl mx-auto bg-black/30 rounded-2xl p-8 mb-8 shadow-lg border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-2">
            Extracted content from social media platforms
          </h2>
          <div
            // Change 3: height 80vh with overflow hidden, expandable with See more
            className={`mb-4 text-purple-200 whitespace-pre-line text-base transition-all duration-500 ${mergedExpanded ? "h-auto overflow-visible" : "h-[80vh] overflow-hidden"}`}
          >
            {posts.map((post, i) => (
              <div key={post.id} className="mb-2">
                <strong>{i + 1}. {post.title}</strong>
                {post.selftext && <div>{post.selftext}</div>}
                <div className="italic text-purple-300 text-sm mb-2">
                  r/{post.subreddit} • {post.score} points · {post.comments.length} comments
                </div>
                {post.comments.length > 0 && (
                  <ul className="list-disc pl-8 text-purple-300">
                    {post.comments.slice(0, 2).map((c, idx) =>
                      <li key={idx}>
                        {c.body} <span className="text-orange-400">({c.score})</span>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
          {!mergedExpanded && (
            <button
              className="text-cyan-400 underline mt-2"
              onClick={() => setMergedExpanded(true)}
            >
              See more
            </button>
          )}
          {mergedExpanded && (
            <button
              className="text-cyan-400 underline mt-2"
              onClick={() => setMergedExpanded(false)}
            >
              ...see less
            </button>
          )}
          <div className="mt-4 flex justify-center">
            <button
              className="px-6 py-3 bg-gradient-to-r from-green-700 to-emerald-900 text-white rounded-xl font-bold flex items-center gap-3"
              onClick={handleRewriteAI}
              disabled={isRewriting}
            >
              {isRewriting ? <RefreshCw className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              Generate Sentiment Report
            </button>
          </div>
        </section>
      )}


      {/* AI PDF CARD */}
      {aiText && selectedTopic && (
        <section className="max-w-3xl mx-auto mb-8">
          <div
            className="bg-gradient-to-tr from-purple-800/80 to-indigo-900/80 p-6 rounded-xl shadow-xl border border-purple-400 cursor-pointer flex flex-col items-center"
            onClick={() => pdfUrl && window.open(pdfUrl, "_blank")}
          >
            <FileText className="w-14 h-14 text-white mb-2" />
            <div className="text-lg font-bold text-white mb-1">{`SentimentReport_${selectedTopic}`}</div>
            <div className="text-xs text-purple-200">Click to view full AI summary report (PDF)</div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-800"
              onClick={handleDownloadReport}
            >
              <Download className="w-5 h-5" />
              Download report (.pdf)
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-700 text-white font-semibold hover:bg-cyan-800"
              onClick={() => setShowShareModal(true)}
            >
              <Share2 className="w-5 h-5" />
              Share report
            </button>
          </div>
        </section>
      )}


      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-950 to-gray-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <Share2 className="w-6 h-6" />
                Share Report
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
                { name: "WhatsApp", platform: "whatsapp", color: "from-green-800 to-green-700", icon: FaWhatsapp },
                { name: "Facebook", platform: "facebook", color: "from-blue-900 to-blue-700", icon: Facebook },
                { name: "Instagram", platform: "instagram", color: "from-pink-800 to-purple-800", icon: Instagram },
                { name: "Telegram", platform: "telegram", color: "from-cyan-800 to-blue-800", icon: Send },
                { name: "Reddit", platform: "reddit", color: "from-orange-800 to-red-800", icon: FaReddit },
                { name: "Native Share", platform: "native", color: "from-gray-700 to-gray-600", icon: Share2 },
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


      {/* FOOTER */}
      <footer className="text-center py-12 px-4 border-t border-white/10 mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="p-2 bg-gradient-to-r from-purple-700 to-indigo-900 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">SentiX.AI</h3>
          </div>
          <p className="text-purple-200 mb-6">
          Transforming conversations across social media platforms into clear, data-driven sentiment reports with the power of AI.
          </p>
          
          <div className="mt-8 text-purple-300/70 text-sm">Made with care ❤️ to decode sentiment with clarity.</div>
        </div>
      </footer>
    </div>
  );
};


export default Service;
