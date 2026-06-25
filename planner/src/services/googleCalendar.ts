// Google Calendar integration service
// Uses Google Identity Services (GIS) for OAuth and Calendar REST API

import type { GoogleTokenClient } from "../types/google";

const SCOPES = "https://www.googleapis.com/auth/calendar.events";
const DEFAULT_EXPIRES_IN_SEC = 3600;
const EXPIRY_BUFFER_MS = 60_000;

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export interface CalendarEvent {
    id: string;
    title: string;
    startMins: number;
    endMins: number;
    color: string;
    allDay: boolean;
    source: "google";
    originalStart: string | null;
    originalEnd: string | null;
}

interface GoogleCalendarEventDate {
    date?: string;
    dateTime?: string;
}

interface GoogleCalendarEventItem {
    id?: string;
    summary?: string;
    colorId?: string;
    start?: GoogleCalendarEventDate;
    end?: GoogleCalendarEventDate;
}

interface GoogleCalendarEventsResponse {
    items?: GoogleCalendarEventItem[];
}

export interface GoogleEventUpdate {
    start?: string;
    end?: string;
    summary?: string;
}

let tokenClient: GoogleTokenClient | null = null;

// Restore Google token from localStorage if available and not expired
let accessToken: string | null = null;
let tokenExpiresAt = 0;
try {
    const cachedToken = localStorage.getItem("google_access_token");
    const cachedExpiresAt = parseInt(localStorage.getItem("google_token_expires_at") || "0", 10);
    if (cachedToken && cachedExpiresAt > Date.now()) {
        accessToken = cachedToken;
        tokenExpiresAt = cachedExpiresAt;
    } else {
        localStorage.removeItem("google_access_token");
        localStorage.removeItem("google_token_expires_at");
    }
} catch (e) {
    console.error("Failed to read google token from localStorage", e);
}

let refreshPromise: Promise<string | null> | null = null;
let pendingResolve: ((token: string | null) => void) | null = null;
const tokenListeners = new Set<(token: string | null) => void>();

function notifyTokenListeners(token: string | null) {
    tokenListeners.forEach((listener) => listener(token));
}

function setAccessToken(token: string, expiresInSec = DEFAULT_EXPIRES_IN_SEC) {
    accessToken = token;
    tokenExpiresAt = Date.now() + expiresInSec * 1000 - EXPIRY_BUFFER_MS;
    try {
        localStorage.setItem("google_access_token", token);
        localStorage.setItem("google_token_expires_at", tokenExpiresAt.toString());
    } catch (e) {
        console.error("Failed to save google token to localStorage", e);
    }
    notifyTokenListeners(token);
}

export function invalidateGoogleToken() {
    accessToken = null;
    tokenExpiresAt = 0;
    try {
        localStorage.removeItem("google_access_token");
        localStorage.removeItem("google_token_expires_at");
    } catch (e) {
        console.error("Failed to clear google token from localStorage", e);
    }
}

export function isGoogleTokenValid(): boolean {
    return !!accessToken && Date.now() < tokenExpiresAt;
}

export function registerGoogleTokenListener(listener: (token: string | null) => void): () => void {
    tokenListeners.add(listener);
    if (accessToken) listener(accessToken);
    return () => tokenListeners.delete(listener);
}

export function initGoogleAuth(): Promise<void> {
    return new Promise((resolve) => {
        const checkGsi = () => {
            const oauth2 = window.google?.accounts?.oauth2;
            if (oauth2) {
                tokenClient = oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (response) => {
                        if (response.error || !response.access_token) {
                            pendingResolve?.(null);
                            pendingResolve = null;
                            refreshPromise = null;
                            return;
                        }
                        setAccessToken(response.access_token, response.expires_in ?? DEFAULT_EXPIRES_IN_SEC);
                        pendingResolve?.(response.access_token);
                        pendingResolve = null;
                        refreshPromise = null;
                    },
                });
                resolve();
            } else {
                setTimeout(checkGsi, 200);
            }
        };
        checkGsi();
    });
}

export interface EnsureGoogleAccessOptions {
    interactive?: boolean;
}

/**
 * Returns a valid access token, refreshing silently when possible.
 */
export async function ensureGoogleAccessToken(
    options: EnsureGoogleAccessOptions = {}
): Promise<string | null> {
    const interactive = options.interactive ?? false;

    if (isGoogleTokenValid() && accessToken) {
        return accessToken;
    }

    if (!interactive) {
        return null;
    }

    if (!tokenClient) {
        await initGoogleAuth();
    }
    if (!tokenClient) return null;

    if (!refreshPromise) {
        refreshPromise = new Promise<string | null>((resolve) => {
            pendingResolve = resolve;
            tokenClient!.requestAccessToken({ prompt: interactive ? "consent" : "" });
        }).finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

/** @deprecated Prefer ensureGoogleAccessToken */
export function requestGoogleAccess(silent = false) {
    void ensureGoogleAccessToken({ interactive: !silent });
}

export function revokeGoogleAccess(token: string) {
    window.google?.accounts?.oauth2?.revoke(token);
    invalidateGoogleToken();
    notifyTokenListeners(null);
}

function isoToMins(isoStr: string): number {
    const d = new Date(isoStr);
    return d.getHours() * 60 + d.getMinutes();
}

async function fetchEventsForDateWithToken(token: string, dateIso: string): Promise<CalendarEvent[]> {
    const [year, month, day] = dateIso.split("-").map(Number);
    const startOfDay = new Date(year, month - 1, day);
    const endOfDay = new Date(year, month - 1, day + 1);

    const params = new URLSearchParams({
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "50",
    });

    const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
        if (res.status === 401) throw new Error("TOKEN_EXPIRED");
        throw new Error(`Calendar API error: ${res.status}`);
    }

    const data = await res.json() as GoogleCalendarEventsResponse;
    const events: CalendarEvent[] = [];

    for (const item of data.items || []) {
        if (!item.id || !item.start || !item.end) continue;
        const isAllDay = !!item.start?.date && !item.start?.dateTime;
        const startValue = isAllDay ? item.start.date : item.start.dateTime;
        const endValue = isAllDay ? item.end.date : item.end.dateTime;
        if (!startValue || !endValue) continue;

        events.push({
            id: item.id,
            title: item.summary || "Untitled Event",
            startMins: isAllDay ? 0 : isoToMins(startValue),
            endMins: isAllDay ? 24 * 60 : isoToMins(endValue),
            color: item.colorId ? getGoogleColor(item.colorId) : "#4285f4",
            allDay: isAllDay,
            source: "google",
            originalStart: startValue,
            originalEnd: endValue,
        });
    }

    return events;
}

export async function fetchEventsForDate(token: string, dateIso: string): Promise<CalendarEvent[]> {
    return fetchEventsForDateWithToken(token, dateIso);
}

export async function fetchEventsForDateAuthenticated(dateIso: string): Promise<CalendarEvent[]> {
    const token = await ensureGoogleAccessToken({ interactive: false });
    if (!token) throw new Error("NOT_CONNECTED");

    try {
        return await fetchEventsForDateWithToken(token, dateIso);
    } catch (err) {
        if (err instanceof Error && err.message === "TOKEN_EXPIRED") {
            invalidateGoogleToken();
            const refreshed = await ensureGoogleAccessToken({ interactive: false });
            if (!refreshed) throw err;
            return fetchEventsForDateWithToken(refreshed, dateIso);
        }
        throw err;
    }
}

export async function fetchTodayEvents(token: string): Promise<CalendarEvent[]> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return fetchEventsForDate(token, `${year}-${month}-${day}`);
}

async function updateGoogleEventWithToken(
    token: string,
    eventId: string,
    updates: GoogleEventUpdate
) {
    const body: { start?: { dateTime: string }; end?: { dateTime: string }; summary?: string } = {};
    if (updates.start) body.start = { dateTime: updates.start };
    if (updates.end) body.end = { dateTime: updates.end };
    if (updates.summary) body.summary = updates.summary;

    const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }
    );

    if (!res.ok) {
        if (res.status === 401) throw new Error("TOKEN_EXPIRED");
        throw new Error(`Calendar API update error: ${res.status}`);
    }

    return await res.json();
}

export async function updateGoogleEvent(
    token: string,
    eventId: string,
    updates: GoogleEventUpdate
) {
    return updateGoogleEventWithToken(token, eventId, updates);
}

export async function updateGoogleEventAuthenticated(
    eventId: string,
    updates: GoogleEventUpdate
) {
    const token = await ensureGoogleAccessToken({ interactive: false });
    if (!token) throw new Error("NOT_CONNECTED");

    try {
        return await updateGoogleEventWithToken(token, eventId, updates);
    } catch (err) {
        if (err instanceof Error && err.message === "TOKEN_EXPIRED") {
            invalidateGoogleToken();
            const refreshed = await ensureGoogleAccessToken({ interactive: false });
            if (!refreshed) throw err;
            return updateGoogleEventWithToken(refreshed, eventId, updates);
        }
        throw err;
    }
}

function getGoogleColor(colorId: string): string {
    const map: Record<string, string> = {
        "1": "#7986cb",
        "2": "#33b679",
        "3": "#8e24aa",
        "4": "#e67c73",
        "5": "#f6bf26",
        "6": "#f4511e",
        "7": "#039be5",
        "8": "#616161",
        "9": "#3f51b5",
        "10": "#0b8043",
        "11": "#d50000",
    };
    return map[colorId] || "#4285f4";
}
