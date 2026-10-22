import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeLocalStorage } from '../lib/storage';
import { callGemini } from './geminiService';
import { toast } from 'react-hot-toast';

export interface NewsHeadline {
  id: string;
  category: 'ZAMBIA' | 'AFRICA' | 'GLOBAL' | 'BUSINESS' | 'WEATHER' | 'CULTURE' | 'TECH' | 'LOCAL' | 'BUZZ' | 'LIFESTYLE';
  title: string;
  source: string;
  timeAgo: string;
  dateKey?: string; // YYYY-MM-DD
}

// Get the current local date key formatted as YYYY-MM-DD
export const getTodayDateKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Formatted long date string, e.g. "Wednesday, 23 September 2026"
export const getFormattedTodayDate = (): string => {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Generates initial dynamic headlines stamped for today's real date, eliminating outdated static text
export const getTodayDynamicSeedHeadlines = (): NewsHeadline[] => {
  const todayKey = getTodayDateKey();
  return [
    {
      id: `seed-1-${todayKey}`,
      category: 'ZAMBIA',
      title: 'Ministry of Education & ECZ release updated national curriculum directives and academic term guidance.',
      source: 'MoE Zambia Bulletin',
      timeAgo: 'Today',
      dateKey: todayKey
    },
    {
      id: `seed-2-${todayKey}`,
      category: 'BUSINESS',
      title: 'Bank of Zambia and market regulators report economic resilience and stable exchange activity.',
      source: 'BOZ Financial Wire',
      timeAgo: 'Today',
      dateKey: todayKey
    },
    {
      id: `seed-3-${todayKey}`,
      category: 'WEATHER',
      title: 'Zambia Meteorological Department forecasts clear and seasonal conditions across Lusaka and regional provinces.',
      source: 'Zambia Met Services',
      timeAgo: 'Today',
      dateKey: todayKey
    },
    {
      id: `seed-4-${todayKey}`,
      category: 'LOCAL',
      title: 'Provincial education centers roll out modern teacher digital training workshops for term planning.',
      source: 'National News Digest',
      timeAgo: 'Today',
      dateKey: todayKey
    },
    {
      id: `seed-5-${todayKey}`,
      category: 'AFRICA',
      title: 'Southern African regional infrastructure and renewable energy initiatives advance to enhance regional trade.',
      source: 'African Development Dispatch',
      timeAgo: 'Today',
      dateKey: todayKey
    }
  ];
};

const NEWS_CACHE_KEY = 'fortunes_news_cache_v2';
const NEWS_DATE_KEY = 'fortunes_news_date_key';
const NEWS_LAST_FETCH_KEY = 'fortunes_news_last_fetch_ms';

// Read headlines from local cache ONLY if they strictly match today's date
export const getCachedHeadlinesForToday = (): NewsHeadline[] | null => {
  try {
    const cachedDate = safeLocalStorage.getItem(NEWS_DATE_KEY);
    const todayKey = getTodayDateKey();

    // If cache is from yesterday or an older day, IMMEDIATELY flash it away (purge)
    if (cachedDate !== todayKey) {
      safeLocalStorage.removeItem(NEWS_CACHE_KEY);
      safeLocalStorage.removeItem(NEWS_DATE_KEY);
      safeLocalStorage.removeItem(NEWS_LAST_FETCH_KEY);
      return null;
    }

    const raw = safeLocalStorage.getItem(NEWS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate each item belongs to today or is clean
        return parsed.filter(item => !item.dateKey || item.dateKey === todayKey);
      }
    }
  } catch (err) {
    console.warn("News cache read notice:", err);
  }
  return null;
};

// Save fresh headlines for today
export const saveHeadlinesForToday = (headlines: NewsHeadline[]): void => {
  try {
    const todayKey = getTodayDateKey();
    const tagged = headlines.map(h => ({ ...h, dateKey: todayKey }));
    safeLocalStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(tagged));
    safeLocalStorage.setItem(NEWS_DATE_KEY, todayKey);
    safeLocalStorage.setItem(NEWS_LAST_FETCH_KEY, Date.now().toString());
  } catch (err) {
    console.warn("News cache save notice:", err);
  }
};

// Flash away all stored headlines (purge cache completely)
export const flashAwayOldNews = (): void => {
  safeLocalStorage.removeItem(NEWS_CACHE_KEY);
  safeLocalStorage.removeItem(NEWS_DATE_KEY);
  safeLocalStorage.removeItem(NEWS_LAST_FETCH_KEY);
};

// Fetch fresh headlines using Gemini with Google Search grounding
export const fetchLiveFreshHeadlines = async (location: string = 'Lusaka, Zambia'): Promise<NewsHeadline[]> => {
  const todayStr = getFormattedTodayDate();
  const todayKey = getTodayDateKey();

  const prompt = `Today is ${todayStr}. Search the web using Google Search grounding for the latest, breaking, real-world current news, headlines, and trending events in Zambia and internationally for today (${todayStr}).

CRITICAL CONSTRAINTS:
1. You MUST generate 10-14 REAL, UP-TO-DATE, FACTUAL news headlines happening right now / today (${todayStr}).
2. Absolutely DO NOT invent or recycle outdated placeholder text. Any old or prior-year headlines MUST BE EXCLUDED.
3. Absolutely DO NOT include any internal app features, app promotions, "Fortunes Edutech", "EduPlan AI", or software tool updates. Only provide real-world news and verified current affairs.
4. Categories to cover:
   - ZAMBIA: National governance, education, civic news in Zambia
   - BUSINESS: Bank of Zambia, economy, mining, Kwacha exchange rate, trade
   - LOCAL: Community, school, teacher development, or provincial news in ${location}
   - WEATHER: Today's temperatures and forecast for Zambian provinces
   - AFRICA: Regional developments across Southern and East Africa
   - GLOBAL: Major international news and world events
   - BUZZ: Sports, culture, viral discussions, or technology

Return ONLY a raw JSON array of objects with keys: "id", "category", "title", "source", "timeAgo".
Allowed categories: "LOCAL" | "BUZZ" | "LIFESTYLE" | "WEATHER" | "BUSINESS" | "ZAMBIA" | "GLOBAL" | "AFRICA"

Example format:
[
  {"id": "1", "category": "ZAMBIA", "title": "Government commences nationwide distribution of updated learning materials.", "source": "Zambia Daily Mail", "timeAgo": "Just now"},
  {"id": "2", "category": "BUSINESS", "title": "Bank of Zambia reports stable currency trends supported by copper exports.", "source": "BOZ Economic Bulletin", "timeAgo": "20m ago"}
]`;

  let textRes = "";
  try {
    const resWithTools = await callGemini("DEFAULT", [
      { role: "user", parts: [{ text: prompt }] }
    ], {
      temperature: 0.7,
      tools: [{ googleSearch: {} }]
    });
    textRes = resWithTools.text || resWithTools.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (toolErr) {
    console.warn("Search grounding tool unavailable for headlines, using standard generative call:", toolErr);
    const resDirect = await callGemini("DEFAULT", prompt);
    textRes = resDirect.text || "";
  }

  if (!textRes) {
    const resDirect = await callGemini("DEFAULT", prompt);
    textRes = resDirect.text || "";
  }

  const jsonMatch = textRes.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const formatted: NewsHeadline[] = parsed.map((item: any, idx: number) => ({
        id: `fresh-${todayKey}-${idx}-${Date.now()}`,
        category: (item.category || 'ZAMBIA') as NewsHeadline['category'],
        title: String(item.title || '').trim(),
        source: String(item.source || 'Zambia News Network').trim(),
        timeAgo: String(item.timeAgo || 'Today').trim(),
        dateKey: todayKey
      })).filter(item => item.title.length > 5);

      if (formatted.length > 0) {
        // Save locally
        saveHeadlinesForToday(formatted);

        // Sync to Firestore global_settings/daily_news for all users across Zambia
        try {
          await setDoc(doc(db, 'global_settings', 'daily_news'), {
            dateKey: todayKey,
            dateFormatted: todayStr,
            headlines: formatted,
            updatedAt: serverTimestamp(),
            lastFetchedMs: Date.now()
          }, { merge: true });
        } catch (fsErr) {
          console.warn("Firestore daily_news sync notice:", fsErr);
        }

        return formatted;
      }
    }
  }

  throw new Error("Unable to parse fresh headlines JSON array");
};

// Global shared state hook for live news streaming
export function useFreshNews() {
  const [headlines, setHeadlines] = useState<NewsHeadline[]>(() => {
    const cached = getCachedHeadlinesForToday();
    return cached && cached.length > 0 ? cached : getTodayDynamicSeedHeadlines();
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeDateKey, setActiveDateKey] = useState(getTodayDateKey());
  const isFetchingRef = useRef(false);

  // Function to completely flash away old news and load fresh news immediately
  const flashAndRefreshNews = useCallback(async (notify: boolean = true) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsRefreshing(true);

    try {
      // 1. Instantly flash away old cache to ensure no stale headlines linger
      flashAwayOldNews();

      // 2. Fetch fresh live headlines with Google Search grounding
      const freshItems = await fetchLiveFreshHeadlines();
      if (freshItems && freshItems.length > 0) {
        // 3. Atomically replace old headlines with fresh ones
        setHeadlines(freshItems);
        setActiveDateKey(getTodayDateKey());
        if (notify) {
          toast.success("✨ Fresh daily headlines loaded!", { id: 'fresh-news-toast' });
        }
      }
    } catch (err: any) {
      console.warn("Error refreshing fresh news:", err?.message || err);
      // If network fails, seed with fresh today's dynamic headlines
      const seed = getTodayDynamicSeedHeadlines();
      setHeadlines(seed);
      saveHeadlinesForToday(seed);
    } finally {
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  // 1. Listen to Firestore real-time daily news document
  useEffect(() => {
    const todayKey = getTodayDateKey();
    const docRef = doc(db, 'global_settings', 'daily_news');

    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.dateKey === todayKey && Array.isArray(data.headlines) && data.headlines.length > 0) {
          // If Firestore has fresh news for today, update immediately
          setHeadlines(data.headlines);
          saveHeadlinesForToday(data.headlines);
          setActiveDateKey(todayKey);
          return;
        }
      }

      // If Firestore doesn't have today's news (e.g. new day has arrived), fetch fresh news!
      const cached = getCachedHeadlinesForToday();
      if (!cached || cached.length === 0) {
        flashAndRefreshNews(false);
      }
    }, (err) => {
      console.warn("Firestore daily_news listener notice:", err);
    });

    return () => unsubscribe();
  }, [flashAndRefreshNews]);

  // 2. Midnight & Date change watcher: Flashes away yesterday's news as soon as calendar flips
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTodayKey = getTodayDateKey();
      if (currentTodayKey !== activeDateKey) {
        console.log(`[NewsService] Day rolled over from ${activeDateKey} to ${currentTodayKey}. Flashing away old news...`);
        setActiveDateKey(currentTodayKey);
        flashAwayOldNews();
        flashAndRefreshNews(false);
      }
    }, 30000); // Check every 30 seconds for day turnover

    return () => clearInterval(interval);
  }, [activeDateKey, flashAndRefreshNews]);

  // 3. Mount-time freshness check: if headlines are older than 25 minutes, refresh in background
  useEffect(() => {
    const lastFetch = parseInt(safeLocalStorage.getItem(NEWS_LAST_FETCH_KEY) || '0', 10);
    const isOlderThan25Mins = Date.now() - lastFetch > 25 * 60 * 1000;
    const isNotToday = safeLocalStorage.getItem(NEWS_DATE_KEY) !== getTodayDateKey();

    if (isNotToday || isOlderThan25Mins) {
      const timer = setTimeout(() => {
        flashAndRefreshNews(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [flashAndRefreshNews]);

  return {
    headlines,
    isRefreshing,
    todayFormatted: getFormattedTodayDate(),
    refreshNews: flashAndRefreshNews,
    flashAndRefresh: () => flashAndRefreshNews(true)
  };
}
