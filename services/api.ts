
import { Trip, User, PlannedTrip } from '../types';

// In a real app, this would make network requests to a server.
// Here, we use localStorage to simulate a persistent database.

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const initialTrips: Trip[] = [
  {
    id: '1',
    title: 'Adventure in the Alps',
    startDate: '2023-08-15',
    endDate: '2023-08-25',
    coverPhoto: 'https://picsum.photos/seed/alps/800/600',
    entries: [
      { id: 'e1', date: '2023-08-16', title: 'First Hike', content: 'The air was crisp and the views were breathtaking. We saw a marmot!', location: 'Grindelwald, Switzerland', photos: [{ id: 'p1', dataUrl: 'https://picsum.photos/seed/hike1/400/300', caption: 'On the trail.' }] },
      { id: 'e2', date: '2023-08-18', title: 'Lake Brienz', content: 'Took a boat trip on the turquoise waters of Lake Brienz. Unforgettable!', location: 'Interlaken, Switzerland', photos: [{ id: 'p2', dataUrl: 'https://picsum.photos/seed/lake/400/300', caption: 'Turquoise waters.' }] }
    ],
    expenses: [
        {id: 'ex1', date: '2023-08-16', description: 'Train ticket', amount: 75},
        {id: 'ex2', date: '2023-08-18', description: 'Boat rental', amount: 120},
    ]
  },
  {
    id: '2',
    title: 'Exploring Kyoto',
    startDate: '2024-04-05',
    endDate: '2024-04-12',
    coverPhoto: 'https://picsum.photos/seed/kyoto/800/600',
    entries: [
        { id: 'e3', date: '2024-04-06', title: 'Fushimi Inari Shrine', content: 'Walked through thousands of torii gates. A truly magical experience.', location: 'Kyoto, Japan', photos: [] }
    ],
    expenses: []
  }
];

const initialPlans: PlannedTrip[] = [
    {
        id: 'plan1',
        title: 'Coastal Italy Roadtrip',
        destination: 'Amalfi Coast, Italy',
        startDate: '2025-06-10',
        endDate: '2025-06-20',
        itinerary: [
            {id: 'i1', date: '2025-06-11', activity: 'Hike the Path of the Gods'},
            {id: 'i2', date: '2025-06-13', activity: 'Explore Positano'},
        ]
    }
];


// --- User Management ---

export const signup = async (name: string, email: string, password: string): Promise<User | null> => {
    await delay(500);
    const users: User[] = JSON.parse(localStorage.getItem('my-travel-tales-users') || '[]');
    
    if (users.some(u => u.email === email)) {
        return null; // User already exists
    }

    const newUser: User = { id: Date.now().toString(), name, email, password };
    const updatedUsers = [...users, newUser];
    localStorage.setItem('my-travel-tales-users', JSON.stringify(updatedUsers));
    localStorage.setItem('my-travel-tales-currentUser', JSON.stringify(newUser));
    
    // Initialize data for new user with sample data
    await saveTrips(newUser.id, initialTrips);
    await savePlannedTrips(newUser.id, initialPlans);
    
    return newUser;
};

export const login = async (email: string, password: string): Promise<User | null> => {
    await delay(500);
    const users: User[] = JSON.parse(localStorage.getItem('my-travel-tales-users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        localStorage.setItem('my-travel-tales-currentUser', JSON.stringify(user));
        return user;
    }
    
    return null;
};

export const logout = async (): Promise<void> => {
    await delay(200);
    localStorage.removeItem('my-travel-tales-currentUser');
};

export const checkSession = async (): Promise<User | null> => {
    await delay(100);
    const userJson = localStorage.getItem('my-travel-tales-currentUser');
    return userJson ? JSON.parse(userJson) : null;
};

// --- Data Management ---

export const getTrips = async (userId: string): Promise<Trip[]> => {
    await delay(500);
    const tripsJson = localStorage.getItem(`my-travel-tales-trips-${userId}`);
    // If user has no data (e.g., old user before sample data was added), give them the initial sample data
    if (tripsJson === null) {
        await saveTrips(userId, initialTrips);
        return initialTrips;
    }
    return JSON.parse(tripsJson);
};

export const saveTrips = async (userId: string, trips: Trip[]): Promise<void> => {
    await delay(300);
    localStorage.setItem(`my-travel-tales-trips-${userId}`, JSON.stringify(trips));
};

export const getPlannedTrips = async (userId: string): Promise<PlannedTrip[]> => {
    await delay(500);
    const plansJson = localStorage.getItem(`my-travel-tales-plans-${userId}`);
     if (plansJson === null) {
        await savePlannedTrips(userId, initialPlans);
        return initialPlans;
    }
    return JSON.parse(plansJson);
};

export const savePlannedTrips = async (userId: string, plans: PlannedTrip[]): Promise<void> => {
    await delay(300);
    localStorage.setItem(`my-travel-tales-plans-${userId}`, JSON.stringify(plans));
};
