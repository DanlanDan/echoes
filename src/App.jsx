import React, { useState, useEffect } from 'react';
import { 
  Send, 
  MessageSquare, 
  Heart, 
  Clock, 
  Ghost,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  increment 
} from 'firebase/firestore';
// KEEP THIS (Make sure it points to your file)
import { db, auth } from './firebase';
// --- Firebase Initialization ---
// For the preview environment, we use the injected config.
// When deploying to Render, replace this block with your actual Firebase config object:
// const firebaseConfig = { apiKey: "...", authDomain: "...", ... };

const App = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [category, setCategory] = useState("Confession");
  const [isPosting, setIsPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Authentication (Required for Database Access)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
        setErrorMsg("Authentication failed. Please refresh.");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Real-time Data Feed
  useEffect(() => {
    if (!user) return;

    // We use the specific path required for this environment
    const postsRef = collection(db, 'artifacts', appId, 'public', 'data', 'thoughts');
    
    // Note: Simple query without complex orderBy first to avoid index errors in preview
    // We will sort in memory for this demo
    const q = query(postsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Sort in memory to handle timestamps correctly
      fetchedPosts.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setPosts(fetchedPosts);
    }, (err) => {
      console.error("Fetch error:", err);
      setErrorMsg("Unable to load posts.");
    });

    return () => unsubscribe();
  }, [user]);

  // 3. Handle Submitting a Post
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || !user) return;
    
    setIsPosting(true);
    try {
      const postsRef = collection(db, 'artifacts', appId, 'public', 'data', 'thoughts');
      await addDoc(postsRef, {
        text: newPost,
        category,
        likes: 0,
        createdAt: serverTimestamp(),
        color: getRandomColor(),
        authorId: user.uid // Anonymous ID
      });
      setNewPost("");
    } catch (error) {
      console.error("Error adding post: ", error);
      setErrorMsg("Could not post. Try again.");
    }
    setIsPosting(false);
  };

  // 4. Handle Liking a Post
  const handleLike = async (id) => {
    if (!user) return;
    try {
      const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'thoughts', id);
      await updateDoc(postRef, {
        likes: increment(1)
      });
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const getRandomColor = () => {
    const colors = [
      "from-pink-500 to-rose-500",
      "from-purple-500 to-indigo-500",
      "from-cyan-500 to-blue-500",
      "from-emerald-500 to-teal-500",
      "from-orange-500 to-red-500"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-purple-500/30 font-sans">
      
      {/* --- Navbar --- */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ghost className="text-purple-500" />
            <span className="font-bold text-xl tracking-tight">Echoes<span className="text-purple-500">.</span></span>
          </div>
          <div className="flex items-center gap-4">
             {errorMsg && <span className="text-xs text-red-400">{errorMsg}</span>}
             <div className="text-xs font-medium bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
               {user ? 'Connected' : 'Connecting...'}
             </div>
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="pt-24 pb-20 px-6 max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Share the Untold.
          </h1>
          <p className="text-slate-400">
            A safe space to share your thoughts, confessions, and stories anonymously.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-12 focus-within:border-purple-500/50 transition-colors shadow-xl">
          <form onSubmit={handleSubmit}>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-transparent resize-none outline-none text-slate-200 placeholder-slate-500 min-h-[100px]"
              maxLength={280}
            />
            
            <div className="flex justify-between items-center mt-4 border-t border-slate-800 pt-4">
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-950 text-xs text-slate-400 border border-slate-800 rounded-lg px-2 py-1 outline-none focus:border-purple-500"
              >
                <option>Confession</option>
                <option>Thought</option>
                <option>Story</option>
                <option>Vent</option>
              </select>

              <button 
                type="submit" 
                disabled={isPosting || !newPost.trim() || !user}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2"
              >
                {isPosting ? <Sparkles size={16} className="animate-spin" /> : <Send size={16} />}
                Post
              </button>
            </div>
          </form>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          <AnimatePresence>
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all overflow-hidden"
              >
                {/* Decorative Gradient Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${post.color || 'from-purple-500 to-blue-500'} opacity-70`}></div>

                <div className="pl-2">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {post.category}
                    </span>
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <Clock size={12} />
                      {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                    </span>
                  </div>

                  <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap mb-6">
                    {post.text}
                  </p>

                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-2 text-slate-500 hover:text-pink-500 transition-colors group/like"
                    >
                      <Heart size={18} className={`transition-all ${post.likes > 0 ? 'text-pink-500 fill-pink-500/10' : 'group-hover/like:fill-pink-500'}`} />
                      <span className="text-sm font-medium">{post.likes || 0}</span>
                    </button>
                    
                    <button className="flex items-center gap-2 text-slate-500 hover:text-purple-500 transition-colors">
                      <MessageSquare size={18} />
                      <span className="text-sm">Reply</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {posts.length === 0 && user && (
            <div className="text-center py-20 opacity-50">
              <Ghost size={48} className="mx-auto mb-4 text-slate-600" />
              <p>No echoes yet. Be the first to speak.</p>
            </div>
          )}

          {!user && (
             <div className="text-center py-20 text-slate-500">
               <Sparkles className="animate-spin mx-auto mb-2" />
               <p>Connecting to the ether...</p>
             </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default App;