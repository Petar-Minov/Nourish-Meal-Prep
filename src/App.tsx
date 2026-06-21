import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, Outlet, Navigate, useLocation } from "react-router";
import { ShoppingBag, ChevronRight, ChevronLeft, CheckCircle, Package, LogIn, LogOut, Plus, Trash2, Edit, Star, MapPin, Phone, Mail, Send, Search } from "lucide-react";
import { auth, googleAuthProvider } from "./lib/firebase.ts";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";

// --- API ---
const api = {
  getMeals: () => fetch("/api/meals").then(r => r.json()),
  getMeal: (id: string) => fetch(`/api/meals/${id}`).then(r => r.json()),
  submitOrder: (order: any) => fetch("/api/orders", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order)
  }).then(r => r.json()),
  getAdminOrders: (token: string) => fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
  addMeal: (meal: any, token: string) => fetch("/api/admin/meals", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(meal)
  }).then(r => r.json()),
  updateMeal: (id: string, meal: any, token: string) => fetch(`/api/admin/meals/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(meal)
  }).then(r => r.json()),
  deleteMeal: (id: string, token: string) => fetch(`/api/admin/meals/${id}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json()),
  getReviews: () => fetch("/api/reviews").then(r => r.json()),
  addReview: (review: {name: string, text: string, stars: number}) => fetch("/api/reviews", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(review)
  }).then(r => r.json()),
};

// --- AUTH CONTEXT ---
interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
}
const AuthContext = createContext<AuthContextType>({ user: null, loading: true, token: null });

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const t = await u.getIdToken();
        setToken(t);
      } else {
        setToken(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return <AuthContext.Provider value={{ user, loading, token }}>{children}</AuthContext.Provider>;
}

// --- CART CONTEXT ---
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}
interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  total: number;
}
const CartContext = createContext<CartContextType>({ items: [], addToCart: () => {}, removeFromCart: () => {}, clearCart: () => {}, total: 0 });

function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const addToCart = (item: CartItem) => {
    setItems(prev => {
      const ex = prev.find(i => i.id === item.id);
      if (ex) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
      return [...prev, item];
    });
  };
  const removeFromCart = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setItems([]);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

// --- LAYOUT ---
function Layout() {
  const { items } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const id = location.hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  const handleNavClick = (id: string) => {
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        navigate(`/#${id}`, { replace: true });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans text-[#2D2D2D] flex flex-col w-full overflow-x-hidden">
      <header className="bg-white sticky top-0 z-50 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between w-full">
          <button onClick={() => handleNavClick('home')} className="flex items-center">
            <img src="/logo.png" alt="Nourish Meal Prep" className="h-8 md:h-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling!.classList.remove('hidden'); }} />
            <div className="hidden text-xl font-bold italic serif tracking-tight text-[#2D5A27] items-center gap-4">
              <div className="w-10 h-10 bg-[#2D5A27] text-white rounded-xl flex items-center justify-center font-bold font-sans not-italic text-xl shadow-sm">N</div>
              Nourish Meal Prep
            </div>
          </button>
          <nav className="flex items-center gap-6 font-bold text-xs uppercase tracking-widest text-gray-400">
            <Link to="/menu" className="hover:text-[#2D5A27] transition">Menu</Link>
            <button onClick={() => handleNavClick('about')} className="hover:text-[#2D5A27] transition uppercase tracking-widest">About</button>
            <button onClick={() => handleNavClick('reviews')} className="hover:text-[#2D5A27] transition uppercase tracking-widest">Reviews</button>
            <button onClick={() => handleNavClick('contact')} className="hover:text-[#2D5A27] transition uppercase tracking-widest">Contact</button>
            <Link to="/cart" className="relative hover:text-[#2D5A27] transition flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#2D5A27] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {items.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </Link>
            {user && (
               <Link to="/admin" className="bg-[#F0F5EE] text-[#2D5A27] px-3 py-1.5 rounded shadow-sm hover:bg-[#E0E7DE] transition">Admin</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto w-full">
          <Outlet />
        </div>
      </main>
      <footer className="h-12 bg-white border-t border-black/5 px-6 flex items-center justify-between shrink-0 z-50 mt-auto">
        <div className="max-w-6xl w-full mx-auto flex justify-between items-center">
          <div className="flex space-x-6">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span> Database Connected</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:inline-block pt-1 flex items-center">Made by Petar Minov</span>
          </div>
          <div className="flex space-x-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Help</span>
            <span>Terms</span>
            <span>Privacy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- ABOUT US ---
function About() {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 w-full">
      <div className="bg-white rounded-3xl p-8 md:p-12 border border-black/5 shadow-sm text-center">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D5A27] mb-2">About Us</h3>
        <h1 className="text-3xl md:text-5xl font-bold text-[#2D2D2D] font-serif italic mb-6">Our Story</h1>
        <div className="space-y-6 text-gray-500 font-medium leading-relaxed text-sm md:text-base max-w-2xl mx-auto text-left">
          <p>
            It all started in a small kitchen with a big idea: what if eating healthy didn't have to be hard? As fitness enthusiasts and busy professionals, we were constantly struggling to find meals that were both nutritionally balanced and actually tasted good. Fast food was convenient but felt terrible, and spending hours meal-prepping on Sundays was robbing us of our weekends.
          </p>
          <p>
            That's when Nourish Meal Prep was born. We partnered with expert chefs and certified nutritionists to create a menu that bridges the gap between culinary excellence and optimal nutrition. Every meal we craft is a testament to our belief that food should be a source of energy, healing, and joy.
          </p>
          <p>
            Today, we are proud to serve thousands of happy customers, delivering fresh, perfectly portioned, and macro-balanced meals right to their doorsteps. Whether you're an athlete training for your next competition, a parent trying to feed your family better, or simply someone who wants to feel their best, we are here to support your journey.
          </p>
          <p className="font-bold text-[#2D5A27] text-center pt-4 italic">
            Eat well. Live better. Nourish.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- CONTACT ---
function Contact() {
  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 w-full">
      <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D5A27] mb-2 text-center">Contact Us</h3>
      <h1 className="text-3xl font-bold text-[#2D2D2D] font-serif italic mb-8 text-center">Get in Touch</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm flex flex-col justify-center space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#F0F5EE] text-[#2D5A27] rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D2D2D] mb-1">Our Location</h3>
              <p className="text-sm text-gray-500 font-medium">123 Wellness Avenue<br/>Fresh City, FC 90210</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#F0F5EE] text-[#2D5A27] rounded-xl flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D2D2D] mb-1">Phone</h3>
              <p className="text-sm text-gray-500 font-medium">+1 (555) 123-4567</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#F0F5EE] text-[#2D5A27] rounded-xl flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D2D2D] mb-1">Email</h3>
              <p className="text-sm text-gray-500 font-medium">hello@nourishmealprep.com</p>
            </div>
          </div>
          <div className="pt-6 border-t border-black/5">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#2D5A27] hover:text-[#3a6b33] font-bold text-xs uppercase tracking-widest transition">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> Follow us on Facebook
            </a>
          </div>
        </div>
        <div className="bg-[#F5F5F0] rounded-3xl overflow-hidden border border-black/5 h-[400px] relative">
          <iframe 
            src="https://www.openstreetmap.org/export/embed.html?bbox=-118.41,34.05,-118.40,34.06&layer=mapnik&marker=34.055,-118.405" 
            title="Location Map"
            className="absolute inset-0 w-full h-full border-0"
          ></iframe>
        </div>
      </div>
    </div>
  );
}

// --- REVIEWS ---
function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', text: '', stars: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    api.getReviews().then(res => {
      setReviews(Array.isArray(res) ? res : []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };
  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const added = await api.addReview(newReview);
      setReviews([added, ...reviews]);
      setShowForm(false);
      setNewReview({ name: '', text: '', stars: 5 });
      setCurrentIndex(0);
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D5A27] mb-2">Reviews</h3>
          <h1 className="text-3xl font-bold text-[#2D2D2D] font-serif italic">Customer Reviews</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">See what our community is saying.</p>
        </div>
      </div>

      {loading ? (
         <div className="py-24 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">Loading reviews...</div>
      ) : (
        <div className="relative mb-10">
          {reviews.length === 0 ? (
            <div className="py-16 text-center text-gray-400 font-bold uppercase tracking-widest text-xs border border-dashed border-black/10 rounded-3xl bg-white">
              No reviews yet. Be the first!
            </div>
          ) : (
            <div className="flex items-center gap-4">
               {reviews.length > 1 && (
                 <button onClick={prevReview} className="w-10 h-10 rounded-full bg-white border border-black/5 shadow-sm flex items-center justify-center text-gray-500 hover:text-[#2D5A27] transition shrink-0 z-10">
                   <ChevronLeft className="w-5 h-5" />
                 </button>
               )}
               <div className="flex-1 overflow-hidden relative min-h-[160px] md:min-h-[140px]">
                 {reviews.map((review, i) => {
                   let transformClass = 'translate-x-full opacity-0';
                   if (i === currentIndex) {
                     transformClass = 'translate-x-0 opacity-100 z-10';
                   } else if (i === (currentIndex - 1 + reviews.length) % reviews.length) {
                     transformClass = '-translate-x-full opacity-0';
                   }
                   return (
                   <div key={review.id} className={`absolute w-full top-0 left-0 transition-all duration-700 ease-out transform ${transformClass} bg-white rounded-3xl p-6 md:p-8 border border-black/5 shadow-sm flex flex-col gap-4`}>
                     <div className="flex items-center justify-between">
                       <span className="font-bold text-[#2D2D2D]">{review.name}</span>
                       <div className="flex">
                         {[...Array(5)].map((_, i) => (
                           <Star key={i} className={`w-4 h-4 ${i < review.stars ? 'text-yellow-400 fill-current' : 'text-gray-200 fill-current'}`} />
                         ))}
                       </div>
                     </div>
                     <p className="text-sm text-gray-500 font-medium leading-relaxed italic">"{review.text}"</p>
                     <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</span>
                   </div>
                 )})}
               </div>
               {reviews.length > 1 && (
                 <button onClick={nextReview} className="w-10 h-10 rounded-full bg-white border border-black/5 shadow-sm flex items-center justify-center text-gray-500 hover:text-[#2D5A27] transition shrink-0 z-10">
                   <ChevronRight className="w-5 h-5" />
                 </button>
               )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-center mb-6">
        <button onClick={() => setShowForm(!showForm)} className="bg-[#2D5A27] text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#3a6b33] transition shadow-sm w-fit">
          {showForm ? "Cancel" : "Add a Review"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D2D2D] mb-4">Write your review</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input required type="text" value={newReview.name} onChange={e=>setNewReview({...newReview, name: e.target.value})} className="w-full p-4 bg-[#F5F5F0] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5A27] transition text-sm font-medium placeholder:text-gray-400" placeholder="Your Name" />
            </div>
            <div>
              <textarea required value={newReview.text} onChange={e=>setNewReview({...newReview, text: e.target.value})} className="w-full p-4 bg-[#F5F5F0] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5A27] transition text-sm font-medium placeholder:text-gray-400 h-24 resize-none" placeholder="Share your experience with us..." />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Rating:</span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(star => (
                   <button key={star} type="button" onClick={() => setNewReview({...newReview, stars: star})} className={`transition ${newReview.stars >= star ? 'text-yellow-400' : 'text-gray-200'}`}>
                     <Star className="w-6 h-6 fill-current" />
                   </button>
                ))}
              </div>
            </div>
            <button disabled={submitting} className="w-full py-4 bg-[#2D2D2D] hover:bg-[#1f1f1f] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition shadow-sm mt-2 disabled:opacity-50 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Send Review
            </button>
          </form>
        </div>
      )}

    </div>
  );
}

// --- HOME PAGE ---
function Home() {
  const [meals, setMeals] = useState<any[]>([]);

  useEffect(() => {
    api.getMeals().then(res => setMeals(Array.isArray(res) ? res.slice(0, 3) : []));
  }, []);

  return (
    <div className="flex-1 flex flex-col w-full pb-24">
      <div id="home" className="p-6 max-w-6xl mx-auto w-full flex flex-col gap-12 content-start pt-8 pb-16">
        <section className="min-h-[250px] md:h-80 bg-[#2D5A27] rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center md:items-center p-8 md:px-12 shadow-lg shrink-0 justify-center md:justify-start">
          <div className="absolute right-0 top-0 w-full md:w-1/2 h-full bg-[#3a6b33] md:skew-x-[-20deg] md:translate-x-16 opacity-50 md:opacity-100"></div>
          <div className="relative z-10 max-w-md text-center md:text-left">
            <h1 className="text-white text-4xl md:text-5xl font-light italic serif mb-2">Healthy Meals <br className="hidden md:block"/><span className="font-bold">Delivered Daily.</span></h1>
            <p className="text-white/70 text-sm md:text-base mt-4 mb-8">
              Fresh, macro-balanced, chef-prepared meals ready to eat in minutes. No cooking. No cleaning. Just results.
            </p>
          </div>
          <Link to="/menu" className="relative z-10 md:ml-auto bg-white text-[#2D5A27] px-8 py-3.5 rounded-full font-bold text-xs hover:bg-[#F5F5F0] transition-colors shadow-sm uppercase tracking-widest inline-flex items-center gap-2">
              Browse Full Menu <ChevronRight className="w-4 h-4" />
          </Link>
        </section>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-black/5 p-8 flex flex-col shadow-sm">
            <div className="w-16 h-16 bg-[#F0F5EE] text-[#2D5A27] rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#2D2D2D] mb-2">Fresh Ingredients</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">Sourced locally, prepared daily by our expert chefs directly for your diet.</p>
          </div>
          <div className="bg-white rounded-3xl border border-black/5 p-8 flex flex-col shadow-sm">
            <div className="w-16 h-16 bg-[#F0F5EE] text-[#2D5A27] rounded-2xl flex items-center justify-center mb-6">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#2D2D2D] mb-2">Delivered Fresh</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">Never frozen. Delivered right to your doorstep in insulated cooling containers.</p>
          </div>
          <div className="bg-white rounded-3xl border border-black/5 p-8 flex flex-col shadow-sm">
            <div className="w-16 h-16 bg-[#F0F5EE] text-[#2D5A27] rounded-2xl flex items-center justify-center mb-6">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#2D2D2D] mb-2">Ready to Eat</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">Heat for exactly 2 minutes and enjoy your perfectly macro-balanced meal.</p>
          </div>
        </section>

        {meals.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg md:text-xl font-bold flex items-center text-[#2D2D2D] font-serif italic">
                Most Wanted Dishes
              </h2>
              <Link to="/menu" className="text-[10px] font-bold text-[#2D5A27] uppercase tracking-widest hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {meals.map(meal => (
                <Link to={`/meal/${meal.id}`} key={meal.id} className="bg-white rounded-2xl border border-black/5 p-5 flex flex-col shadow-sm group hover:border-[#2D5A27]/30 transition-colors">
                  <div className="h-48 bg-[#F0F5EE] rounded-xl mb-4 flex items-center justify-center overflow-hidden relative">
                    {meal.imageUrl ? (
                      <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-20 h-20 bg-white rounded-full shadow-inner flex items-center justify-center text-gray-300"><ShoppingBag className="w-8 h-8" /></div>
                    )}
                    {meal.dietaryTags && meal.dietaryTags.length > 0 && (
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {meal.dietaryTags.slice(0, 2).map((tag: string) => (
                          <span key={tag} className="bg-white/90 backdrop-blur-sm text-[#2D5A27] px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest shadow-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg leading-tight text-[#2D2D2D]">{meal.name}</h4>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{meal.description}</p>
                    </div>
                    <span className="font-bold text-[#2D5A27] shrink-0">${Number(meal.price).toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-dashed border-gray-100 text-center mb-4">
                    <div><p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Cal</p><p className="text-xs font-bold text-[#2D2D2D]">{meal.calories}</p></div>
                    <div><p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Pro</p><p className="text-xs font-bold text-[#2D2D2D]">{meal.protein}g</p></div>
                    <div><p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Car</p><p className="text-xs font-bold text-[#2D2D2D]">{meal.carbs}g</p></div>
                    <div><p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Fat</p><p className="text-xs font-bold text-[#2D2D2D]">{meal.fats}g</p></div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <div id="about" className="border-t border-black/5 bg-white py-16">
        <About />
      </div>

      <div id="reviews" className="border-t border-black/5 py-16">
        <Reviews />
      </div>

      <div id="contact" className="border-t border-black/5 bg-white py-16">
        <Contact />
      </div>

    </div>
  );
}

// --- MENU PAGE ---
function Menu() {
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(30); // reasonable max
  const highestPrice = Math.max(...meals.map(m => Number(m.price)), 30);

  useEffect(() => {
    api.getMeals().then(res => {
      const data = Array.isArray(res) ? res : [];
      setMeals(data);
      const maxP = Math.max(...data.map((m: any) => Number(m.price)), 30);
      setMaxPrice(Math.ceil(maxP));
      setLoading(false);
    }).catch(err => {
      console.error(err); setLoading(false);
    });
  }, []);

  const categories = ['All', ...new Set(meals.map(m => m.category).filter(Boolean))] as string[];
  const filteredMeals = meals.filter(m => {
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.ingredients && m.ingredients.some((i: string) => i.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesPrice = Number(m.price) <= maxPrice;
    return matchesCategory && matchesSearch && matchesPrice;
  });

  if (loading) return <div className="py-24 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">Loading seasonal menu...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 w-full">
      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D5A27] mb-2">Menu</h3>
        <h1 className="text-3xl font-bold text-[#2D2D2D] font-serif italic mb-2">Our Dishes</h1>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="w-full md:w-1/3 relative text-[#2D2D2D]">
           <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
           <input 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Search meals or ingredients..."
             className="w-full pl-10 pr-4 py-3 bg-white border border-black/5 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2D5A27] shadow-sm"
           />
        </div>
        <div className="w-full md:w-1/3 flex items-center gap-4 bg-white border border-black/5 rounded-full px-4 py-3 shadow-sm">
           <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Max Price: ${maxPrice}</span>
           <input 
             type="range" 
             min="0" 
             max={Math.ceil(highestPrice)} 
             value={maxPrice} 
             onChange={(e) => setMaxPrice(Number(e.target.value))}
             className="w-full accent-[#2D5A27]"
           />
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h2 className="text-sm font-bold flex items-center uppercase tracking-widest text-gray-500 shrink-0">
          <span className="w-2 h-2 bg-[#2D5A27] rounded-full mr-2 hidden md:inline-block"></span> Current Seasonal Menu
        </h2>
        <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar max-w-full">
          {categories.map(c => (
            <button key={c} onClick={() => setSelectedCategory(c)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors shadow-sm border ${selectedCategory === c ? 'bg-[#2D5A27] text-white border-[#2D5A27]' : 'bg-white text-gray-500 border-black/5 hover:bg-[#F5F5F0]'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMeals.map(meal => (
          <Link to={`/meal/${meal.id}`} key={meal.id} className="bg-white rounded-2xl border border-black/5 p-5 flex flex-col shadow-sm group hover:border-[#2D5A27]/30 transition-colors">
            <div className="h-48 bg-[#F0F5EE] rounded-xl mb-4 flex items-center justify-center overflow-hidden relative">
              {meal.imageUrl ? (
                <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-20 h-20 bg-white rounded-full shadow-inner flex items-center justify-center text-gray-300"><ShoppingBag className="w-8 h-8" /></div>
              )}
              {meal.dietaryTags && meal.dietaryTags.length > 0 && (
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {meal.dietaryTags.slice(0, 2).map((tag: string) => (
                    <span key={tag} className="bg-white/90 backdrop-blur-sm text-[#2D5A27] px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between items-start mb-2 gap-4">
              <div className="flex-1">
                <h4 className="font-bold text-lg leading-tight text-[#2D2D2D]">{meal.name}</h4>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{meal.description}</p>
              </div>
              <span className="font-bold text-[#2D5A27] shrink-0">${Number(meal.price).toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-dashed border-gray-100 text-center mb-4">
              <div><p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Cal</p><p className="text-xs font-bold text-[#2D2D2D]">{meal.calories}</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Pro</p><p className="text-xs font-bold text-[#2D2D2D]">{meal.protein}g</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Car</p><p className="text-xs font-bold text-[#2D2D2D]">{meal.carbs}g</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Fat</p><p className="text-xs font-bold text-[#2D2D2D]">{meal.fats}g</p></div>
            </div>
            <div className="mt-auto w-full bg-[#F5F5F0] text-[#2D5A27] py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-[#E0E7DE] transition-colors text-center pointer-events-none">
              View Details
            </div>
          </Link>
        ))}
        {filteredMeals.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400 font-bold uppercase tracking-widest text-xs border border-dashed border-black/10 rounded-2xl bg-white">
            No meals available for this category yet.
          </div>
        )}
      </div>
    </div>
  );
}

// --- MEAL DETAILS ---
function MealDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const [meal, setMeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getMeal(id).then(res => {
      if(res.error) navigate('/menu');
      else setMeal(res);
      setLoading(false);
    }).catch(err => {
      console.error("Error fetching meal:", err);
      navigate('/menu');
    });
  }, [id, navigate]);

  if (loading) return <div className="py-24 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">Loading meal details...</div>;
  if (!meal) return <div className="py-24 text-center">Meal not found</div>;

  const handleAdd = () => {
    addToCart({ id: meal.id, name: meal.name, price: Number(meal.price), quantity, imageUrl: meal.imageUrl });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 w-full">
      <Link to="/menu" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[#2D5A27] transition mb-6 inline-flex items-center gap-2">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back to Menu
      </Link>
      <div className="bg-white rounded-3xl overflow-hidden border border-black/5 shadow-sm flex flex-col md:flex-row">
        <div className="md:w-1/2 relative bg-[#F5F5F0] aspect-square md:aspect-auto">
          {meal.imageUrl && <img src={meal.imageUrl} alt={meal.name} className="absolute inset-0 w-full h-full object-cover" />}
        </div>
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col">
          <h1 className="text-3xl font-extrabold text-[#2D2D2D] mb-2 font-serif italic">{meal.name}</h1>
          <p className="text-xl font-bold text-[#2D5A27] mb-6">${Number(meal.price).toFixed(2)}</p>
          <p className="text-gray-500 font-medium leading-relaxed text-sm mb-6">{meal.description}</p>
          
          {meal.dietaryTags && meal.dietaryTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {meal.dietaryTags.map((tag: string) => (
                <span key={tag} className="bg-[#F0F5EE] text-[#2D5A27] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-[#2D5A27]/10">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 mb-6 border-y border-dashed border-gray-100 py-6 text-center">
            <div><span className="block text-xl font-bold text-[#2D2D2D] mb-1">{meal.calories}</span><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cal</span></div>
            <div><span className="block text-xl font-bold text-[#2D2D2D] mb-1">{meal.protein}g</span><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pro</span></div>
            <div><span className="block text-xl font-bold text-[#2D2D2D] mb-1">{meal.carbs}g</span><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Carbs</span></div>
            <div><span className="block text-xl font-bold text-[#2D2D2D] mb-1">{meal.fats}g</span><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fats</span></div>
          </div>

          {(meal.ingredients || meal.allergens) && (
            <div className="mb-8 space-y-4">
              {meal.ingredients && meal.ingredients.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ingredients</h4>
                  <p className="text-sm font-medium text-[#2D2D2D] capitalize leading-relaxed">
                    {meal.ingredients.join(', ')}.
                  </p>
                </div>
              )}
              {meal.allergens && meal.allergens.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Allergens</h4>
                  <div className="flex gap-2">
                    {meal.allergens.map((a: string) => (
                       <span key={a} className="bg-red-50 text-red-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-red-100">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-auto">
            <div className="flex items-center justify-between mb-6 border border-black/5 rounded-2xl p-2 bg-[#F5F5F0]">
              <span className="font-bold text-xs uppercase tracking-widest text-[#2D2D2D] ml-4">Quantity</span>
              <div className="flex items-center bg-white rounded-xl overflow-hidden border border-black/5 shadow-sm">
                <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="w-10 h-10 flex items-center justify-center font-bold text-[#2D2D2D] hover:bg-[#F0F5EE] transition">-</button>
                <div className="w-10 text-center font-bold text-[#2D2D2D] flex items-center justify-center">{quantity}</div>
                <button onClick={() => setQuantity(q => q+1)} className="w-10 h-10 flex items-center justify-center font-bold text-[#2D2D2D] hover:bg-[#F0F5EE] transition">+</button>
              </div>
            </div>
            <button onClick={handleAdd} disabled={added} className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm ${added ? "bg-[#2D2D2D] text-white" : "bg-[#2D5A27] hover:bg-[#3a6b33] text-white"}`}>
              {added ? "Added to Order ✓" : `Add to Order — $${(Number(meal.price) * quantity).toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- CART & CHECKOUT ---
function Cart() {
  const { items, removeFromCart, clearCart, total } = useContext(CartContext);
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(items.length === 0) return;
    setSubmitting(true);
    try {
      await api.submitOrder({ customerName, email, items, totalPrice: total });
      setSuccess(true);
      clearCart();
    } catch {
      alert("Failed to submit order.");
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white m-8 max-w-2xl mx-auto rounded-3xl border border-black/5 shadow-sm self-center justify-self-center my-auto">
        <div className="w-20 h-20 bg-[#F0F5EE] text-[#2D5A27] rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold mb-2 text-[#2D2D2D] font-serif italic">Order Confirmed!</h2>
        <p className="text-gray-400 font-medium text-sm mb-8">Your optimal nutrition is being prepared and will be delivered soon.</p>
        <Link to="/menu" className="bg-[#F5F5F0] text-[#2D5A27] px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#E0E7DE] transition">Return to Menu</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 w-full flex flex-col lg:flex-row gap-8">
      <div className="lg:w-2/3 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Your Selection</h2>
          <span className="text-[10px] font-bold text-[#2D5A27] bg-[#F0F5EE] px-3 py-1 rounded-full uppercase tracking-widest">{items.length} Items</span>
        </div>
        {items.length === 0 ? (
          <div className="text-center py-16 bg-white border border-black/5 rounded-3xl shadow-sm">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 mb-6 text-sm font-medium">Your bag is empty.</p>
            <Link to="/menu" className="text-[#2D5A27] font-bold text-xs uppercase tracking-widest hover:underline">Browse our menu</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-black/5 shadow-sm group relative">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F5F5F0] flex-shrink-0">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-bold text-sm text-[#2D2D2D] truncate">{item.name}</h3>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Qty x {item.quantity}</div>
                </div>
                <div className="font-bold text-sm text-[#2D5A27] pr-10">${item.price.toFixed(2)}</div>
                <button onClick={() => removeFromCart(item.id)} className="absolute right-5 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition bg-[#F5F5F0] group-hover:bg-[#F0F5EE] rounded-full">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {items.length > 0 && (
        <div className="lg:w-1/3">
          <div className="sticky top-24 bg-white rounded-3xl p-8 border border-black/5 shadow-sm h-full flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D2D2D] mb-6">Order Details</h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">Subtotal</span>
                <span className="font-bold text-[#2D2D2D]">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">Delivery</span>
                <span className="font-bold text-[#2D5A27]">Free</span>
              </div>
            </div>
            <div className="flex justify-between border-t border-black/5 pt-4 mb-8">
              <span className="text-sm font-bold uppercase tracking-widest text-[#2D2D2D]">Total</span>
              <span className="font-bold text-[#2D5A27]">${total.toFixed(2)}</span>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-auto">
              <div>
                <input required type="text" value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full p-4 bg-[#F5F5F0] border border-black/5 rounded-xl focus:outline-none focus:border-[#2D5A27] transition text-sm font-medium placeholder:text-gray-400" placeholder="Full Name" />
              </div>
              <div>
                <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-4 bg-[#F5F5F0] border border-black/5 rounded-xl focus:outline-none focus:border-[#2D5A27] transition text-sm font-medium placeholder:text-gray-400" placeholder="Email Address" />
              </div>
              <button disabled={submitting} className="w-full py-4 bg-[#2D5A27] hover:bg-[#3a6b33] text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition shadow-sm mt-4 disabled:opacity-50">
                {submitting ? "Processing..." : "Finalize Order"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- ADMIN PAGES ---
function Admin() {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="py-24 text-center">Loading...</div>;
  if (!user) return <AdminLogin />;
  return <AdminDashboard />;
}

function AdminLogin() {
  return (
    <div className="py-24 flex justify-center w-full px-4">
      <div className="bg-white p-12 rounded-3xl border border-black/5 shadow-sm max-w-md w-full text-center">
        <div className="w-16 h-16 bg-[#F0F5EE] text-[#2D5A27] rounded-full flex items-center justify-center mx-auto mb-6">
          <LogIn className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2 font-serif italic">Admin Portal</h2>
        <p className="text-gray-500 mb-8 font-medium text-sm">Sign in with your admin account to manage meals and view orders.</p>
        <button onClick={() => signInWithPopup(auth, googleAuthProvider)} className="w-full py-4 bg-[#2D2D2D] hover:bg-[#1f1f1f] text-white rounded-2xl font-bold transition flex justify-center items-center gap-2 text-xs uppercase tracking-widest shadow-sm">
          Sign In with Google
        </button>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { token } = useContext(AuthContext);
  const [meals, setMeals] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'meals'|'orders'>('meals');
  
  // Create / Edit modal state
  const [editingMeal, setEditingMeal] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    if(!token) return;
    const [m, o] = await Promise.all([api.getMeals(), api.getAdminOrders(token)]);
    setMeals(Array.isArray(m) ? m : []); setOrders(Array.isArray(o) ? o : []);
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleDelete = async (id: string) => {
    if(!token || !confirm("Are you sure?")) return;
    await api.deleteMeal(id, token);
    fetchData();
  };

  const saveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!token) return;
    try {
      if(editingMeal.id) {
        await api.updateMeal(editingMeal.id, editingMeal, token);
      } else {
        await api.addMeal(editingMeal, token);
      }
      setIsModalOpen(false);
      fetchData();
    } catch(err) {
      alert("Error saving meal");
    }
  };

  const openNewMeal = () => {
    setEditingMeal({ name: '', description: '', price: 0, calories: 0, protein: 0, carbs: 0, fats: 0, imageUrl: '', category: '', ingredients: [], allergens: [], preparationTime: 0, dietaryTags: [] });
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2D2D] font-serif italic">Dashboard</h1>
          <div className="flex gap-4 mt-6">
            <button onClick={()=>setActiveTab('meals')} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition ${activeTab === 'meals' ? 'bg-[#2D5A27] text-white shadow-sm' : 'bg-white border border-black/5 text-gray-500 hover:bg-[#F5F5F0]'}`}>Meals</button>
            <button onClick={()=>setActiveTab('orders')} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition ${activeTab === 'orders' ? 'bg-[#2D5A27] text-white shadow-sm' : 'bg-white border border-black/5 text-gray-500 hover:bg-[#F5F5F0]'}`}>Orders</button>
          </div>
        </div>
        <button onClick={() => signOut(auth)} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[#2D2D2D] flex items-center gap-2 px-4 py-2 hover:bg-[#F5F5F0] rounded-lg transition">
          <LogOut className="w-4 h-4"/> Sign Out
        </button>
      </div>

      {activeTab === 'meals' && (
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#2D2D2D]">Manage Meals</h2>
            <button onClick={openNewMeal} className="bg-[#2D2D2D] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#1f1f1f] shadow-sm">
              <Plus className="w-4 h-4"/> Add Meal
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F5F5F0] text-gray-400 border-b border-black/5 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="p-4 font-bold">Meal</th>
                  <th className="p-4 font-bold">Macros</th>
                  <th className="p-4 font-bold">Price</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {meals.map(m => (
                  <tr key={m.id} className="hover:bg-[#F0F5EE]/30 transition-colors">
                    <td className="p-4 font-bold text-[#2D2D2D]">{m.name}</td>
                    <td className="p-4 text-gray-500 text-xs font-medium">
                      {m.calories}cal • {m.protein}p • {m.carbs}c • {m.fats}f
                    </td>
                    <td className="p-4 font-bold text-[#2D5A27]">${Number(m.price).toFixed(2)}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => { setEditingMeal(m); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-[#2D5A27] transition"><Edit className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(m.id)} className="p-2 text-gray-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
                {meals.length===0 && <tr><td colSpan={4} className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No meals added yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-black/5 bg-white">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#2D2D2D]">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F5F5F0] text-gray-400 border-b border-black/5 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold">Customer</th>
                  <th className="p-4 font-bold">Items</th>
                  <th className="p-4 font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-[#F0F5EE]/30 transition-colors">
                    <td className="p-4 text-gray-500 font-medium">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-[#2D2D2D]">
                      {o.customerName}
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{o.email}</div>
                    </td>
                    <td className="p-4 text-gray-500 text-xs max-w-xs truncate font-medium">
                      {o.items?.map((i:any) => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="p-4 font-bold text-[#2D5A27]">${Number(o.totalPrice).toFixed(2)}</td>
                  </tr>
                ))}
                {orders.length===0 && <tr><td colSpan={4} className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && editingMeal && (
        <div className="fixed inset-0 bg-[#2D2D2D]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto border border-black/5 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-[#2D2D2D] font-serif italic">{editingMeal.id ? "Edit Meal" : "Add Meal"}</h2>
            <form onSubmit={saveMeal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Name</label>
                  <input required type="text" value={editingMeal.name} onChange={e=>setEditingMeal({...editingMeal, name: e.target.value})} className="w-full p-3 bg-[#F5F5F0] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5A27] transition font-medium text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Description</label>
                  <textarea required value={editingMeal.description} onChange={e=>setEditingMeal({...editingMeal, description: e.target.value})} className="w-full p-3 bg-[#F5F5F0] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5A27] transition font-medium text-sm h-24 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Image URL</label>
                  <input required type="url" value={editingMeal.imageUrl} onChange={e=>setEditingMeal({...editingMeal, imageUrl: e.target.value})} className="w-full p-3 bg-[#F5F5F0] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5A27] transition font-medium text-sm" placeholder="https://..." />
                </div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Price ($)</label><input required type="number" step="0.01" value={editingMeal.price} onChange={e=>setEditingMeal({...editingMeal, price: e.target.value})} className="w-full p-3 bg-[#F5F5F0] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5A27] transition font-medium text-sm" /></div>
                
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Category</label>
                  <input type="text" value={editingMeal.category || ''} onChange={e=>setEditingMeal({...editingMeal, category: e.target.value})} className="w-full p-3 bg-[#F5F5F0] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5A27] transition font-medium text-sm" placeholder="High Protein Meals" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Ingredients (comma separated)</label>
                  <input type="text" value={(editingMeal.ingredients || []).join(', ')} onChange={e=>setEditingMeal({...editingMeal, ingredients: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} className="w-full p-3 bg-[#F5F5F0] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5A27] transition font-medium text-sm" placeholder="chicken, rice, broccoli" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Dietary Tags (comma separated)</label>
                  <input type="text" value={(editingMeal.dietaryTags || []).join(', ')} onChange={e=>setEditingMeal({...editingMeal, dietaryTags: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} className="w-full p-3 bg-[#F5F5F0] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5A27] transition font-medium text-sm" placeholder="gluten-free, high-protein" />
                </div>
                
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Calories</label><input required type="number" value={editingMeal.calories} onChange={e=>setEditingMeal({...editingMeal, calories: e.target.value})} className="w-full p-3 bg-[#F5F5F0] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5A27] transition font-medium text-sm" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Protein (g)</label><input required type="number" value={editingMeal.protein} onChange={e=>setEditingMeal({...editingMeal, protein: e.target.value})} className="w-full p-3 bg-[#F5F5F0] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5A27] transition font-medium text-sm" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Carbs (g)</label><input required type="number" value={editingMeal.carbs} onChange={e=>setEditingMeal({...editingMeal, carbs: e.target.value})} className="w-full p-3 bg-[#F5F5F0] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5A27] transition font-medium text-sm" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Fats (g)</label><input required type="number" value={editingMeal.fats} onChange={e=>setEditingMeal({...editingMeal, fats: e.target.value})} className="w-full p-3 bg-[#F5F5F0] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5A27] transition font-medium text-sm" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-black/5">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="px-6 py-3 font-bold text-xs uppercase tracking-widest text-gray-500 hover:bg-[#F5F5F0] rounded-xl transition">Cancel</button>
                <button type="submit" className="px-6 py-3 font-bold text-xs uppercase tracking-widest bg-[#2D2D2D] text-white rounded-xl hover:bg-[#1f1f1f] transition shadow-sm">Save Meal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- MAIN WRAPPER ---
export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="menu" element={<Menu />} />
              <Route path="meal/:id" element={<MealDetails />} />
              <Route path="cart" element={<Cart />} />
              <Route path="admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
