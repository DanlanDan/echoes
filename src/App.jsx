import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Heart, Clock, Ghost, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
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
import { 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';

// --- IMPORT FROM YOUR LOCAL FILE ---
import { db, auth } from './firebase'; 

const App = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [category, setCategory] = useState("Confession");
  const [isPosting, setIsPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth error:", err);
        setErrorMsg("Authentication failed. Check firebase.js config.");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "thoughts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.error("Fetch error:", err);
      if (err.code === 'permission-denied') {
        setErrorMsg("Permissions error. Check database rules in Firebase Console.");
      } else {
        setErrorMsg("Unable to load posts.");
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || !user) return;
    setIsPosting(true);
    try {
      await addDoc(collection(db, "thoughts"), {
        text: newPost,
        category,
        likes: 0,
        createdAt: serverTimestamp(),
        color: getRandomColor(),
        authorId: user.uid
      });
      setNewPost("");
    } catch (error) {
      console.error("Error adding post: ", error);
      setErrorMsg("Could not post. Try again.");
    }
    setIsPosting(false);
  };

  const handleLike = async (id) => {
    if (!user) return;
    try {
      const postRef = doc(db, "thoughts", id);
      await updateDoc(postRef, { likes: increment(1) });
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
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ghost className="text-purple-500" />
            <span className="font-bold text-xl tracking-tight">Echoes<span className="text-purple-500">.</span></span>
          </div>
          <div className="flex items-center gap-4">
             {errorMsg && <span className="text-xs text-red-400 font-mono">{errorMsg}</span>}
             <div className="text-xs font-medium bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
               {user ? 'Connected' : 'Connecting...'}
             </div>
          </div>
        </div>
      </nav>
      <main className="pt-24 pb-20 px-6 max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Share the Untold.</h1>
          <p className="text-slate-400">A safe space to share your thoughts, confessions, and stories anonymously.</p>
        </div>
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
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${post.color || 'from-purple-500 to-blue-500'} opacity-70`}></div>
                <div className="pl-2">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {post.category}
                    </span>
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <Clock size={12} />
                      {post.createdAt && typeof post.createdAt.toDate === 'function' ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap mb-6">{post.text}</p>
                  <div className="flex items-center gap-6">
                    <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 text-slate-500 hover:text-pink-500 transition-colors group/like">
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