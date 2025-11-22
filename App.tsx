

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import * as api from './services/api';
import { Trip, JournalEntry, Photo, Expense, PlannedTrip, ItineraryItem, User } from './types';
import Spinner from './components/Spinner';
import Modal from './components/Modal';
import { PlusIcon, MapPinIcon, CalendarIcon, SparklesIcon, ArrowLeftIcon, CameraIcon, XIcon, HomeIcon, TripsIcon, AtlasIcon, PlannerIcon, MicIcon, CurrencyDollarIcon, ClipboardListIcon, UserIcon, LogoutIcon } from './components/icons';
import { generateTripSummary, generateCaptionForImage } from './services/geminiService';

type View = 'home' | 'trips' | 'atlas' | 'planner';

const Auth: React.FC<{
  onLogin: (credentials: Pick<User, 'email' | 'password'>) => Promise<boolean>;
  onSignup: (details: Pick<User, 'name' | 'email' | 'password'>) => Promise<boolean>;
}> = ({ onLogin, onSignup }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        let success = false;
        if (isLogin) {
            if (!email || !password) {
                setError('Please enter email and password.');
                setIsLoading(false);
                return;
            }
            success = await onLogin({ email, password });
            if (!success) {
                setError('Invalid email or password.');
            }
        } else {
            if (!name || !email || !password) {
                setError('Please fill in all fields.');
                setIsLoading(false);
                return;
            }
            success = await onSignup({ name, email, password });
            if (!success) {
                setError('An account with this email already exists.');
            }
        }
        setIsLoading(false);
    };
    
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white shadow-2xl rounded-2xl p-8 space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-slate-800 font-serif">MyTravelTales 🧭</h1>
                        <p className="text-slate-500 mt-2">{isLogin ? 'Welcome back, adventurer!' : 'Join the journey!'}</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label htmlFor="name" className="text-sm font-medium text-slate-700">Name</label>
                                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 transition duration-300 shadow-lg flex justify-center items-center disabled:bg-blue-400">
                            {isLoading ? <Spinner size="sm"/> : (isLogin ? 'Log In' : 'Sign Up')}
                        </button>
                    </form>
                    <div className="text-center">
                        <button onClick={() => { setIsLogin(!isLogin); setError('')}} className="text-sm text-blue-600 hover:underline">
                            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [plannedTrips, setPlannedTrips] = useState<PlannedTrip[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [activeView, setActiveView] = useState<View>('home');
  
  const isInitialDataLoaded = useRef(false);

  useEffect(() => {
    const checkLoggedInUser = async () => {
      const user = await api.checkSession();
      setCurrentUser(user);
      setIsLoadingSession(false);
    };
    checkLoggedInUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
        setIsLoadingData(true);
        isInitialDataLoaded.current = false;
        Promise.all([
            api.getTrips(currentUser.id),
            api.getPlannedTrips(currentUser.id)
        ]).then(([fetchedTrips, fetchedPlans]) => {
            setTrips(fetchedTrips);
            setPlannedTrips(fetchedPlans);
            setIsLoadingData(false);
            isInitialDataLoaded.current = true;
        })
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && isInitialDataLoaded.current) {
        api.saveTrips(currentUser.id, trips);
    }
  }, [trips, currentUser]);

  useEffect(() => {
    if (currentUser && isInitialDataLoaded.current) {
        api.savePlannedTrips(currentUser.id, plannedTrips);
    }
  }, [plannedTrips, currentUser]);

  const handleLogin = async (credentials: Pick<User, 'email' | 'password'>): Promise<boolean> => {
      const user = await api.login(credentials.email, credentials.password);
      if (user) {
          setCurrentUser(user);
          return true;
      }
      return false;
  };

  const handleSignup = async (details: Pick<User, 'name' | 'email' | 'password'>): Promise<boolean> => {
      const user = await api.signup(details.name, details.email, details.password);
      if (user) {
          setCurrentUser(user);
          return true;
      }
      return false;
  };
  
  const handleLogout = async () => {
      await api.logout();
      setCurrentUser(null);
  };
  
  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <Spinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
      return <Auth onLogin={handleLogin} onSignup={handleSignup} />;
  }

  const handleConvertToTrip = (planId: string) => {
    const planToConvert = plannedTrips.find(p => p.id === planId);
    if (!planToConvert) return;

    const draftEntries: JournalEntry[] = planToConvert.itinerary.map(item => ({
        id: `draft-${item.id}`,
        date: item.date,
        title: item.activity,
        content: item.notes || ``,
        photos: [],
        location: planToConvert.destination,
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const newTrip: Trip = {
        id: `trip-${planToConvert.id}`,
        title: planToConvert.title,
        startDate: planToConvert.startDate,
        endDate: planToConvert.endDate,
        coverPhoto: `https://picsum.photos/seed/${planToConvert.destination.split(",")[0]}/800/600`,
        entries: draftEntries,
        expenses: [],
    };

    setTrips(prev => [newTrip, ...prev]);
    setPlannedTrips(prev => prev.filter(p => p.id !== planId));
    setActiveView('trips');
  };

  const renderContent = () => {
    if(isLoadingData) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
    }
    switch (activeView) {
      case 'home': return <Home trips={trips} onNavigate={setActiveView} />;
      case 'trips': return <MyTrips trips={trips} setTrips={setTrips} />;
      case 'atlas': return <Atlas trips={trips} />;
      case 'planner': return <Planner plannedTrips={plannedTrips} setPlannedTrips={setPlannedTrips} onConvertToTrip={handleConvertToTrip} />;
      default: return <Home trips={trips} onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      <div className="flex">
        <Sidebar activeView={activeView} setActiveView={setActiveView} user={currentUser} onLogout={handleLogout} />
        <div className="flex-1 md:ml-64">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};


// --- App Structure Components ---

const Sidebar: React.FC<{ activeView: View, setActiveView: (view: View) => void, user: User, onLogout: () => void }> = ({ activeView, setActiveView, user, onLogout }) => {
  const navItems = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'trips', icon: TripsIcon, label: 'My Trips' },
    { id: 'atlas', icon: AtlasIcon, label: 'Atlas' },
    { id: 'planner', icon: PlannerIcon, label: 'Planner' },
  ];

  return (
    <aside className="fixed top-0 left-0 h-full w-16 md:w-64 bg-white/70 backdrop-blur-lg border-r border-slate-200 z-30 flex flex-col">
      <div className="flex-shrink-0">
          <div className="p-4 md:p-6 flex items-center justify-center md:justify-start border-b border-slate-200">
            <h1 className="font-bold text-2xl text-slate-800 font-serif">
              <span className="md:hidden">🧭</span>
              <span className="hidden md:inline">MyTravelTales</span>
            </h1>
          </div>
          <nav className="mt-6">
            <ul>
              {navItems.map(item => (
                <li key={item.id} className="px-2 md:px-4">
                  <button
                    onClick={() => setActiveView(item.id as View)}
                    className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${activeView === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="hidden md:inline ml-4 font-semibold">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
      </div>
      <div className="mt-auto p-2 md:p-4 border-t border-slate-200">
        <div className="flex items-center">
            <UserIcon className="h-10 w-10 text-slate-600 bg-slate-200 rounded-full p-2 flex-shrink-0" />
            <div className="hidden md:block ml-3 overflow-hidden">
                <p className="font-semibold text-slate-800 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <button
                onClick={onLogout}
                className="ml-auto text-slate-500 hover:text-red-600 p-2 rounded-lg hover:bg-slate-200"
                aria-label="Logout"
            >
                <LogoutIcon className="h-6 w-6" />
            </button>
        </div>
      </div>
    </aside>
  );
};

const Home: React.FC<{trips: Trip[], onNavigate: (view: View) => void}> = ({trips, onNavigate}) => {
    const stats = useMemo(() => {
        const countries = new Set(trips.flatMap(t => t.entries.map(e => e.location.split(',')[1]?.trim()).filter(Boolean)));
        const photos = trips.reduce((acc, t) => acc + t.entries.reduce((entryAcc, e) => entryAcc + e.photos.length, 0), 0);
        return {
            tripCount: trips.length,
            countryCount: countries.size,
            photoCount: photos
        }
    }, [trips]);

    const onThisDayMemories = useMemo(() => {
        const today = new Date();
        const month = today.getMonth();
        const day = today.getDate();
        return trips.flatMap(trip => 
            trip.entries
                .filter(entry => {
                    const entryDate = new Date(entry.date);
                    return entryDate.getMonth() === month && entryDate.getDate() === day;
                })
                .map(entry => ({...entry, tripTitle: trip.title, tripId: trip.id}))
        );
    }, [trips]);


    return (
        <div>
            <h1 className="text-4xl font-extrabold text-slate-900 font-serif mb-8">Home Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-slate-500">Total Trips</h3><p className="text-3xl font-bold">{stats.tripCount}</p></div>
                <div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-slate-500">Countries Visited</h3><p className="text-3xl font-bold">{stats.countryCount}</p></div>
                <div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-slate-500">Photos Logged</h3><p className="text-3xl font-bold">{stats.photoCount}</p></div>
            </div>

            {onThisDayMemories.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 font-serif mb-4">On This Day...</h2>
                    <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
                        {onThisDayMemories.map(entry => (
                            <div key={entry.id} className="border-b last:border-b-0 pb-3 last:pb-0">
                                <p className="text-sm text-slate-500">{new Date(entry.date).getFullYear()} in {entry.location}</p>
                                <h4 className="font-bold text-lg">{entry.title}</h4>
                                <p className="text-slate-600 truncate">{entry.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div>
                 <h2 className="text-2xl font-bold text-slate-900 font-serif mb-4">Recent Trips</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {trips.slice(0, 3).map(trip => <TripCard key={trip.id} trip={trip} onSelect={() => onNavigate('trips')} />)}
                </div>
            </div>

        </div>
    );
}

const MyTrips: React.FC<{trips: Trip[], setTrips: (trips: Trip[] | ((prev: Trip[]) => Trip[])) => void}> = ({trips, setTrips}) => {
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
    const [isTripModalOpen, setTripModalOpen] = useState(false);
    const [isEntryModalOpen, setEntryModalOpen] = useState(false);
  
    const handleCreateTrip = (newTrip: Omit<Trip, 'id' | 'entries' | 'coverPhoto' | 'expenses'>) => {
      const trip: Trip = {
        ...newTrip,
        id: Date.now().toString(),
        entries: [],
        expenses: [],
        coverPhoto: `https://picsum.photos/seed/${newTrip.title.split(" ")[0]}/800/600`
      };
      setTrips(prev => [trip, ...prev]);
      setTripModalOpen(false);
    };
  
    const handleCreateEntry = (newEntry: Omit<JournalEntry, 'id'>) => {
      if (!selectedTripId) return;
      const entry: JournalEntry = { ...newEntry, id: Date.now().toString() };
      setTrips(prev => prev.map(trip =>
        trip.id === selectedTripId
          ? { ...trip, entries: [entry, ...trip.entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) }
          : trip
      ));
      setEntryModalOpen(false);
    };

    const handleAddExpense = (tripId: string, newExpense: Omit<Expense, 'id'>) => {
        const expense: Expense = { ...newExpense, id: Date.now().toString() };
        setTrips(prev => prev.map(trip => {
            if (trip.id === tripId) {
                const updatedExpenses = [...(trip.expenses || []), expense];
                updatedExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                return { ...trip, expenses: updatedExpenses };
            }
            return trip;
        }));
    }
      
    const handleGenerateSummary = useCallback(async (tripId: string) => {
      setTrips(prev => prev.map(t => t.id === tripId ? { ...t, isSummaryLoading: true } : t));
      const trip = trips.find(t => t.id === tripId);
      if (trip && trip.entries.length > 0) {
        const allEntriesText = trip.entries.map(e => `Title: ${e.title}\n${e.content}`).join('\n\n');
        const summary = await generateTripSummary(allEntriesText);
        setTrips(prev => prev.map(t =>
          t.id === tripId
            ? { ...t, summary, isSummaryLoading: false }
            : t
        ));
      } else {
          setTrips(prev => prev.map(t => t.id === tripId ? { ...t, summary: "No entries to summarize.", isSummaryLoading: false } : t));
      }
    }, [trips, setTrips]);
  
    const selectedTrip = trips.find(trip => trip.id === selectedTripId);

    return (
        <>
            {!selectedTrip ? (
                <div>
                     <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-slate-900 font-serif">My Journeys</h1>
                        <button
                            onClick={() => setTripModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full flex items-center transition duration-300 shadow-lg hover:shadow-xl"
                        >
                            <PlusIcon /> <span className="hidden sm:inline ml-2">New Trip</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {trips.map(trip => <TripCard key={trip.id} trip={trip} onSelect={() => setSelectedTripId(trip.id)} />)}
                    </div>
                </div>
            ) : (
              <TripDetail
                trip={selectedTrip}
                onBack={() => setSelectedTripId(null)}
                onAddEntry={() => setEntryModalOpen(true)}
                onAddExpense={(expense) => handleAddExpense(selectedTrip.id, expense)}
                onGenerateSummary={handleGenerateSummary}
              />
            )}
            <NewTripModal
                isOpen={isTripModalOpen}
                onClose={() => setTripModalOpen(false)}
                onCreate={handleCreateTrip}
            />
            {selectedTrip && (
                <NewEntryModal
                    isOpen={isEntryModalOpen}
                    onClose={() => setEntryModalOpen(false)}
                    onCreate={handleCreateEntry}
                />
            )}
        </>
    )
}

const Atlas: React.FC<{trips: Trip[]}> = ({trips}) => {
    const locations = useMemo(() => {
        interface LocationOnMap { trips: { id: string; title: string; }[]; pos: { top: string; left: string; }; }
        const locs: { [key: string]: LocationOnMap } = {};
        trips.forEach(trip => {
            trip.entries.forEach(entry => {
            if (entry.location && entry.location.trim() !== '') {
                if (!locs[entry.location]) {
                const hash = entry.location.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
                const top = (Math.abs(hash * 13) % 80) + 10;
                const left = (Math.abs(hash * 29) % 90) + 5;
                locs[entry.location] = { trips: [], pos: { top: `${top}%`, left: `${left}%` } };
                }
                if (!locs[entry.location].trips.some(t => t.id === trip.id)) {
                locs[entry.location].trips.push({ id: trip.id, title: trip.title });
                }
            }
            });
        });
        return locs;
    }, [trips]);
  
    const [activeLocation, setActiveLocation] = useState<string | null>(null);
  
    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-900 font-serif mb-6">Atlas</h1>
            <div className="bg-white rounded-lg shadow-lg p-4 relative h-[75vh] overflow-hidden">
                <div 
                    className="absolute inset-0 bg-no-repeat bg-contain bg-center opacity-20" 
                    style={{backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')"}}
                ></div>
                <p className="text-center text-slate-500 text-sm relative z-10">Hover over a pin to see details</p>
                {Object.keys(locations).map((location) => {
                    const data = locations[location];
                    return (
                        <div key={location} style={data.pos} className="absolute z-10 group"
                            onMouseEnter={() => setActiveLocation(location)}
                            onMouseLeave={() => setActiveLocation(null)}>
                            <MapPinIcon className="h-8 w-8 text-red-500 drop-shadow-lg cursor-pointer transform group-hover:scale-125 transition-transform" />
                            {activeLocation === location && (
                                <div className="absolute bottom-full mb-2 w-48 bg-white p-2 rounded-md shadow-xl text-sm left-1/2 -translate-x-1/2 z-20 transition-opacity animate-fade-in-up">
                                    <p className="font-bold border-b pb-1 mb-1 text-slate-800">{location}</p>
                                    <ul className="space-y-1 max-h-24 overflow-y-auto">
                                        {data.trips.map(trip => (
                                            <li key={trip.id}>
                                                <span className="text-slate-700">{trip.title}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
      </div>
    );
}

const Planner: React.FC<{
    plannedTrips: PlannedTrip[];
    setPlannedTrips: (updater: (prev: PlannedTrip[]) => PlannedTrip[]) => void;
    onConvertToTrip: (planId: string) => void;
}> = ({ plannedTrips, setPlannedTrips, onConvertToTrip }) => {
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [isPlanModalOpen, setPlanModalOpen] = useState(false);

    const handleCreatePlan = (newPlan: Omit<PlannedTrip, 'id' | 'itinerary'>) => {
        const plan: PlannedTrip = {
            ...newPlan,
            id: `plan-${Date.now().toString()}`,
            itinerary: [],
        };
        setPlannedTrips(prev => [plan, ...prev]);
        setPlanModalOpen(false);
    };

    const handleAddItemToItinerary = (planId: string, newItem: Omit<ItineraryItem, 'id'>) => {
        const item: ItineraryItem = { ...newItem, id: `item-${Date.now().toString()}` };
        setPlannedTrips(prev => prev.map(plan => {
            if (plan.id === planId) {
                const updatedItinerary = [...plan.itinerary, item];
                updatedItinerary.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                return { ...plan, itinerary: updatedItinerary };
            }
            return plan;
        }));
    };

    const selectedPlan = plannedTrips.find(p => p.id === selectedPlanId);

    return (
        <>
            {!selectedPlan ? (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-slate-900 font-serif">Trip Planner</h1>
                        <button onClick={() => setPlanModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full flex items-center transition duration-300 shadow-lg hover:shadow-xl">
                            <PlusIcon /> <span className="hidden sm:inline ml-2">New Plan</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {plannedTrips.map(plan => <PlannedTripCard key={plan.id} plan={plan} onSelect={() => setSelectedPlanId(plan.id)} />)}
                    </div>
                </div>
            ) : (
                <PlanDetail
                    plan={selectedPlan}
                    onBack={() => setSelectedPlanId(null)}
                    onAddItem={handleAddItemToItinerary}
                    onConvertToTrip={onConvertToTrip}
                />
            )}
            <NewPlanModal isOpen={isPlanModalOpen} onClose={() => setPlanModalOpen(false)} onCreate={handleCreatePlan} />
        </>
    );
};

// --- Sub-components (Cards, Details, etc.) ---

const TripCard: React.FC<{ trip: Trip, onSelect: () => void }> = ({ trip, onSelect }) => (
    <div onClick={onSelect} className="bg-white rounded-lg shadow-md hover:shadow-2xl transition-shadow duration-300 overflow-hidden cursor-pointer group">
        <img className="h-56 w-full object-cover group-hover:scale-105 transition-transform duration-300" src={trip.coverPhoto} alt={trip.title} />
        <div className="p-5">
            <h3 className="text-xl font-bold text-slate-900 font-serif">{trip.title}</h3>
            <p className="text-slate-500 mt-2 flex items-center"><CalendarIcon className="h-5 w-5 mr-2" /> {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</p>
        </div>
    </div>
);

type TripDetailTab = 'entries' | 'expenses';

const TripDetail: React.FC<{ trip: Trip, onBack: () => void, onAddEntry: () => void, onAddExpense: (expense: Omit<Expense, 'id'>) => void, onGenerateSummary: (tripId: string) => void }> = ({ trip, onBack, onAddEntry, onAddExpense, onGenerateSummary }) => {
    const [activeTab, setActiveTab] = useState<TripDetailTab>('entries');

    return (
        <div>
            <button onClick={onBack} className="flex items-center text-blue-600 hover:underline mb-6 font-semibold">
                <ArrowLeftIcon /> <span className="ml-2">All Trips</span>
            </button>
            <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-8">
                <img className="h-64 md:h-96 w-full object-cover" src={trip.coverPhoto} alt={trip.title} />
                <div className="p-6 md:p-8">
                    <h1 className="text-4xl font-extrabold text-slate-900 font-serif">{trip.title}</h1>
                    <p className="text-slate-500 mt-2 text-lg"><CalendarIcon className="h-5 w-5 mr-2" /> {new Date(trip.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to {new Date(trip.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <div className="mt-6 bg-slate-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">AI Summary</h3>
                            {!trip.summary && !trip.isSummaryLoading && (
                                <button onClick={() => onGenerateSummary(trip.id)} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-sm font-semibold px-3 py-1 rounded-full flex items-center transition">
                                    <SparklesIcon /> Generate
                                </button>
                            )}
                        </div>
                         {trip.isSummaryLoading && <div className="flex justify-center p-4"><Spinner /></div>}
                         {trip.summary && <p className="text-slate-700 mt-2 italic font-serif leading-relaxed">{trip.summary}</p>}
                    </div>
                </div>
            </div>

            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('entries')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'entries' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                        Journal Entries
                    </button>
                    <button onClick={() => setActiveTab('expenses')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'expenses' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                        Expenses
                    </button>
                </nav>
            </div>

            {activeTab === 'entries' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 font-serif">Journal Entries</h2>
                        <button onClick={onAddEntry} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full flex items-center transition duration-300 shadow-lg hover:shadow-xl">
                            <PlusIcon /> <span className="hidden sm:inline ml-2">New Entry</span>
                        </button>
                    </div>
                    <div className="space-y-8">
                        {trip.entries.length > 0 ? trip.entries.map(entry => <JournalEntryItem key={entry.id} entry={entry} />)
                        : <p className="text-center text-slate-500 py-10 bg-white rounded-lg shadow">No entries yet. Add your first memory!</p>}
                    </div>
                </div>
            )}
            
            {activeTab === 'expenses' && (
                <ExpenseTracker expenses={trip.expenses || []} onAddExpense={onAddExpense} />
            )}
        </div>
    );
};

const ExpenseTracker: React.FC<{expenses: Expense[], onAddExpense: (expense: Omit<Expense, 'id'>) => void}> = ({expenses, onAddExpense}) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const totalExpenses = useMemo(() => {
        return expenses.reduce((sum, expense) => sum + expense.amount, 0);
    }, [expenses]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!description || isNaN(numAmount) || numAmount <= 0) {
            alert("Please enter a valid description and positive amount.");
            return;
        }
        onAddExpense({description, amount: numAmount, date});
        setDescription('');
        setAmount('');
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold text-slate-900 font-serif mb-4">Log New Expense</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="exp-desc" className="block text-sm font-medium text-slate-700">Description</label>
                                <input id="exp-desc" type="text" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-slate-900" required />
                            </div>
                            <div>
                                <label htmlFor="exp-amount" className="block text-sm font-medium text-slate-700">Amount</label>
                                <input id="exp-amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-slate-900" required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="exp-date" className="block text-sm font-medium text-slate-700">Date</label>
                            <input id="exp-date" type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-slate-900" required />
                        </div>
                        <div className="text-right">
                             <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-sm">Add Expense</button>
                        </div>
                    </form>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col justify-center items-center">
                    <CurrencyDollarIcon className="h-10 w-10 text-green-500 mb-2"/>
                    <h3 className="text-slate-500 text-lg">Total Expenses</h3>
                    <p className="text-4xl font-extrabold text-slate-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalExpenses)}
                    </p>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-slate-900 font-serif mb-4">Expense List</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {expenses.length > 0 ? expenses.map(exp => (
                        <div key={exp.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-md">
                            <div>
                                <p className="font-semibold text-slate-800">{exp.description}</p>
                                <p className="text-sm text-slate-500">{new Date(exp.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <p className="font-bold text-lg text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(exp.amount)}</p>
                        </div>
                    )) : <p className="text-center text-slate-500 py-6">No expenses logged for this trip yet.</p>}
                </div>
            </div>
        </div>
    );
};

const JournalEntryItem: React.FC<{ entry: JournalEntry }> = ({ entry }) => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold text-slate-900 font-serif">{entry.title}</h3>
        <div className="text-sm text-slate-500 mt-2 mb-4 flex justify-between flex-wrap gap-2">
            <span>{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {entry.location && <span className="flex items-center"><MapPinIcon /> {entry.location}</span>}
        </div>
        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-serif">{entry.content}</p>
        {entry.photos.length > 0 && <PhotoGallery photos={entry.photos} />}
    </div>
);

const PhotoGallery: React.FC<{ photos: Photo[] }> = ({ photos }) => (
    <div className="mt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map(photo => (
                <div key={photo.id} className="group relative">
                    <img src={photo.dataUrl} alt={photo.caption} className="rounded-md object-cover w-full h-40" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-end p-2">
                        <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition">{photo.caption}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const NewTripModal: React.FC<{isOpen: boolean, onClose: () => void, onCreate: (trip: Omit<Trip, 'id' | 'entries' | 'coverPhoto' | 'expenses'>) => void}> = ({isOpen, onClose, onCreate}) => {
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({ title, startDate, endDate });
        setTitle(''); setStartDate(''); setEndDate('');
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Start a New Journey">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700">Trip Name</label>
                    <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-slate-900" required />
                </div>
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">Start Date</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-slate-900" required />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">End Date</label>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-slate-900" required />
                </div>
                <div className="pt-4 flex justify-end">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 mr-3">Cancel</button>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-sm">Create Trip</button>
                </div>
            </form>
        </Modal>
    );
}

const NewEntryModal: React.FC<{isOpen: boolean, onClose: () => void, onCreate: (entry: Omit<JournalEntry, 'id'>) => void}> = ({isOpen, onClose, onCreate}) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [location, setLocation] = useState('');
    const [content, setContent] = useState('');
    const [photos, setPhotos] = useState<Omit<Photo, 'id'>[]>([]);
    const [captionLoading, setCaptionLoading] = useState<number | null>(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);


    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            const recognition = recognitionRef.current;
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        setContent(prev => prev + event.results[i][0].transcript + '. ');
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
            };
            recognition.onerror = (event: any) => console.error('Speech recognition error:', event.error);
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };
    
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // FIX: Iterate directly over `e.target.files` (a FileList).
            // `Array.from(e.target.files)` was causing `file` to be inferred as `unknown`, leading to a type error.
            for (const file of e.target.files) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (event.target?.result) {
                        setPhotos(prev => [...prev, { dataUrl: event.target!.result as string, caption: '' }]);
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };
    
    const handleRemovePhoto = (indexToRemove: number) => setPhotos(prev => prev.filter((_, index) => index !== indexToRemove));

    const handleGenerateCaption = async (index: number) => {
        setCaptionLoading(index);
        const caption = await generateCaptionForImage(photos[index].dataUrl);
        setPhotos(prev => prev.map((p, i) => i === index ? { ...p, caption } : p));
        setCaptionLoading(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isListening) toggleListening();
        const finalPhotos: Photo[] = photos.map((p, i) => ({ ...p, id: Date.now().toString() + i }));
        onCreate({ title, date, location, content, photos: finalPhotos });
        setTitle(''); setDate(new Date().toISOString().split('T')[0]); setLocation(''); setContent(''); setPhotos([]);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add a Journal Entry">
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="Entry Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border-slate-300 font-serif text-lg bg-white text-slate-900" required/>
                <div className="grid grid-cols-2 gap-4">
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-md border-slate-300 bg-white text-slate-900" required/>
                    <input type="text" placeholder="Location (e.g., Paris, France)" value={location} onChange={e => setLocation(e.target.value)} className="w-full rounded-md border-slate-300 bg-white text-slate-900" required/>
                </div>
                <div className="relative">
                    <textarea rows={6} placeholder="What happened today? Or, tap the mic to speak..." value={content} onChange={e => setContent(e.target.value)} className="w-full rounded-md border-slate-300 font-serif bg-white text-slate-900" required />
                    {recognitionRef.current && (
                        <button type="button" onClick={toggleListening} className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                           <MicIcon />
                        </button>
                    )}
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Photos</label>
                    <label htmlFor="photo-upload" className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-md flex items-center justify-center border border-dashed border-slate-400">
                        <CameraIcon /> <span>Upload Photos</span>
                    </label>
                    <input id="photo-upload" type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </div>
                
                {photos.length > 0 && (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {photos.map((photo, index) => (
                            <div key={index} className="flex items-center gap-3 group relative pr-4">
                                <img src={photo.dataUrl} className="w-16 h-16 rounded-md object-cover" alt="Uploaded preview" />
                                <div className="flex-1">
                                    <input type="text" placeholder="Add a caption..." value={photo.caption} onChange={e => setPhotos(prev => prev.map((p, i) => i === index ? {...p, caption: e.target.value} : p))} className="w-full rounded-md border-slate-300 text-sm bg-white text-slate-900" />
                                     <button type="button" onClick={() => handleGenerateCaption(index)} disabled={captionLoading === index} className="text-xs text-indigo-600 hover:underline mt-1 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                                         {captionLoading === index ? <><Spinner size="sm" /> <span className="ml-1">Generating...</span></> : <><SparklesIcon /> AI Caption</>}
                                     </button>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => handleRemovePhoto(index)}
                                    className="absolute top-1/2 right-0 -translate-y-1/2 bg-slate-600/50 text-white rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                    aria-label="Remove photo"
                                >
                                    <XIcon className="h-3 w-3 stroke-2" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-4 flex justify-end">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 mr-3">Cancel</button>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-sm">Save Entry</button>
                </div>
            </form>
        </Modal>
    )
}

const PlannedTripCard: React.FC<{ plan: PlannedTrip, onSelect: () => void }> = ({ plan, onSelect }) => (
    <div onClick={onSelect} className="bg-white rounded-lg shadow-md hover:shadow-2xl transition-shadow duration-300 overflow-hidden cursor-pointer group border-2 border-dashed border-slate-300 hover:border-blue-500">
        <div className="p-5">
            <h3 className="text-xl font-bold text-slate-900 font-serif">{plan.title}</h3>
            <p className="text-slate-500 mt-2 flex items-center"><MapPinIcon /> {plan.destination}</p>
            <p className="text-slate-500 mt-2 flex items-center"><CalendarIcon /> {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}</p>
        </div>
    </div>
);

const PlanDetail: React.FC<{
    plan: PlannedTrip;
    onBack: () => void;
    onAddItem: (planId: string, item: Omit<ItineraryItem, 'id'>) => void;
    onConvertToTrip: (planId: string) => void;
}> = ({ plan, onBack, onAddItem, onConvertToTrip }) => {
    const [activity, setActivity] = useState('');
    const [date, setDate] = useState(plan.startDate);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activity.trim()) return;
        onAddItem(plan.id, { date, activity });
        setActivity('');
    };

    return (
        <div>
            <button onClick={onBack} className="flex items-center text-blue-600 hover:underline mb-6 font-semibold">
                <ArrowLeftIcon /> <span className="ml-2">All Plans</span>
            </button>
            <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 mb-8">
                 <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 font-serif">{plan.title}</h1>
                        <p className="text-slate-500 mt-2 text-lg"><MapPinIcon /> {plan.destination}</p>
                         <p className="text-slate-500 mt-1 text-sm"><CalendarIcon /> {new Date(plan.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(plan.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <button onClick={() => onConvertToTrip(plan.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full flex items-center transition duration-300 shadow-lg hover:shadow-xl">
                        Convert to Journal
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-slate-900 font-serif mb-4">Itinerary</h2>
                     <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {plan.itinerary.length > 0 ? plan.itinerary.map(item => (
                            <div key={item.id} className="flex items-start p-3 bg-slate-50 rounded-md">
                                <ClipboardListIcon />
                                <div>
                                    <p className="font-semibold text-slate-800">{item.activity}</p>
                                    <p className="text-sm text-slate-500">{new Date(item.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>
                        )) : <p className="text-center text-slate-500 py-10">No itinerary items yet. Add your first activity!</p>}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                     <h3 className="text-xl font-bold text-slate-900 font-serif mb-4">Add to Itinerary</h3>
                     <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="plan-activity" className="block text-sm font-medium text-slate-700">Activity</label>
                            <input id="plan-activity" type="text" value={activity} onChange={e => setActivity(e.target.value)} placeholder="e.g., Visit the Colosseum" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-white text-slate-900" required />
                        </div>
                        <div>
                            <label htmlFor="plan-date" className="block text-sm font-medium text-slate-700">Date</label>
                            <input id="plan-date" type="date" value={date} onChange={e => setDate(e.target.value)} min={plan.startDate} max={plan.endDate} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-white text-slate-900" required />
                        </div>
                         <div className="text-right pt-2">
                             <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-sm">Add Item</button>
                        </div>
                     </form>
                </div>
            </div>
        </div>
    );
};

const NewPlanModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (plan: Omit<PlannedTrip, 'id' | 'itinerary'>) => void;
}> = ({ isOpen, onClose, onCreate }) => {
    const [title, setTitle] = useState('');
    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({ title, destination, startDate, endDate });
        setTitle(''); setDestination(''); setStartDate(''); setEndDate('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Plan a New Trip">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="plan-title" className="block text-sm font-medium text-slate-700">Trip Title</label>
                    <input type="text" id="plan-title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-white text-slate-900" placeholder="e.g., Summer in Greece" required />
                </div>
                 <div>
                    <label htmlFor="plan-dest" className="block text-sm font-medium text-slate-700">Destination</label>
                    <input type="text" id="plan-dest" value={destination} onChange={e => setDestination(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-white text-slate-900" placeholder="e.g., Santorini, Greece" required />
                </div>
                <div>
                    <label htmlFor="plan-startDate" className="block text-sm font-medium text-slate-700">Start Date</label>
                    <input type="date" id="plan-startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-white text-slate-900" required />
                </div>
                <div>
                    <label htmlFor="plan-endDate" className="block text-sm font-medium text-slate-700">End Date</label>
                    <input type="date" id="plan-endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-white text-slate-900" required />
                </div>
                <div className="pt-4 flex justify-end">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 mr-3">Cancel</button>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-sm">Create Plan</button>
                </div>
            </form>
        </Modal>
    );
};


export default App;