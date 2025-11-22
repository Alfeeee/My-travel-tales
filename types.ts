
export interface Photo {
  id: string;
  dataUrl: string; // base64 data URL
  caption: string;
}

export interface JournalEntry {
  id: string;
  date: string; // ISO string
  title: string;
  content: string;
  photos: Photo[];
  location: string;
}

export interface Expense {
  id:string;
  date: string; // ISO string
  description: string;
  amount: number;
}

export interface Trip {
  id: string;
  title: string;
  startDate: string; // ISO string
  endDate:string; // ISO string
  coverPhoto: string; // URL
  summary?: string; // AI generated summary
  isSummaryLoading?: boolean;
  entries: JournalEntry[];
  expenses?: Expense[];
}

export interface ItineraryItem {
  id: string;
  date: string; // ISO string
  activity: string;
  notes?: string;
}

export interface PlannedTrip {
  id: string;
  title: string;
  destination: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  itinerary: ItineraryItem[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}
