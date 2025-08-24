import React, { useState } from 'react';

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

interface MergedContentCardProps {
  posts: RedditPost[];
}

const MergedContentCard: React.FC<MergedContentCardProps> = ({ posts }) => {
  const [expanded, setExpanded] = useState(false);

  // Compose the merged text for PDF export
  const mergedText = posts.map((post, idx) => {
    let section = `${idx + 1}. ${post.title}\n`;
    if (post.selftext) section += post.selftext + '\n';
    section += `Subreddit: r/${post.subreddit} | Score: ${post.score}\n`;
    if (post.comments.length > 0) {
      section += 'Top comments:\n';
      section += post.comments.slice(0, 3).map((c, cidx) => `  - ${c.body} (${c.score})`).join('\n') + '\n';
    }
    return section;
  }).join('\n\n');

  return (
    <div
      className="bg-black/60 rounded-2xl border border-white/20 p-6 max-h-[80vh] overflow-hidden relative"
      style={expanded ? { maxHeight: 'none', minHeight: '80vh' } : {}}
    >
      <pre className="text-purple-100 whitespace-pre-wrap text-base font-sans mb-4" style={!expanded ? { maxHeight: '70vh', overflow: 'hidden' } : {}}>
        {mergedText}
      </pre>
      {!expanded && (
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center">
          <button
            className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-900 text-white rounded-lg font-semibold hover:from-purple-800 hover:to-indigo-950 transition-all mb-2"
            onClick={() => setExpanded(true)}
          >
            &lt;...see more&gt;
          </button>
        </div>
      )}
      {expanded && (
        <div className="flex justify-center mt-2">
          <button
            className="px-4 py-2 bg-black/20 text-white rounded-lg font-semibold hover:bg-black/40 border border-white/20 transition-all"
            onClick={() => setExpanded(false)}
          >
            Collapse
          </button>
        </div>
      )}
    </div>
  );
};

export default MergedContentCard;
