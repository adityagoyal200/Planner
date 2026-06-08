// Google Calendar integration service
// Uses Google Identity Services (GIS) for OAuth and Calendar REST API

const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

const CLIENT_ID = "166273735409-jq79q5ehpt72nn9n4o3qgli34c1hrdq8.apps.googleusercontent.com";

export interface CalendarEvent {
    id: string;
    title: string;
    startMins: number; 
    endMins: number;
    color: string;
    allDay: boolean;
    source: "google";
}

let tokenClient: any = null;

export function initGoogleAuth(onTokenReceived: (token: string) => void): Promise<void> {
    return new Promise((resolve) => {
        const checkGsi = () => {
            if ((window as any).google?.accounts?.oauth2) {
                tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (response: any) => {
                        if (response.access_token) {
                            onTokenReceived(response.access_token);
                        }
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

/**
 * Trigger Google sign-in popup.
 */
export function requestGoogleAccess() {
    if (!tokenClient) {
        console.error("Google auth not initialized. Call initGoogleAuth first.");
        return;
    }
    tokenClient.requestAccessToken({ prompt: "consent" });
}

/**
 * Revoke the current token and sign out.
 */
export function revokeGoogleAccess(token: string) {
    if ((window as any).google?.accounts?.oauth2) {
        (window as any).google.accounts.oauth2.revoke(token);
    }
}

/**
 * Parse an ISO datetime or date string into minutes from midnight.
 */
function isoToMins(isoStr: string): number {
    const d = new Date(isoStr);
    return d.getHours() * 60 + d.getMinutes();
}

/**
 * Fetch today's events from the primary Google Calendar.
 */
export async function fetchTodayEvents(token: string): Promise<CalendarEvent[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const params = new URLSearchParams({
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "50",
    });

    const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    if (!res.ok) {
        if (res.status === 401) {
            throw new Error("TOKEN_EXPIRED");
        }
        throw new Error(`Calendar API error: ${res.status}`);
    }

    const data = await res.json();
    const events: CalendarEvent[] = [];

    for (const item of data.items || []) {
        const isAllDay = !!item.start?.date && !item.start?.dateTime;

        events.push({
            id: item.id,
            title: item.summary || "Untitled Event",
            startMins: isAllDay ? 0 : isoToMins(item.start.dateTime),
            endMins: isAllDay ? 24 * 60 : isoToMins(item.end.dateTime),
            color: item.colorId ? getGoogleColor(item.colorId) : "#4285f4",
            allDay: isAllDay,
            source: "google",
        });
    }

    return events;
}

/**
 * Map Google Calendar color IDs to hex colors.
 */
function getGoogleColor(colorId: string): string {
    const map: Record<string, string> = {
        "1": "#7986cb", // Lavender
        "2": "#33b679", // Sage
        "3": "#8e24aa", // Grape
        "4": "#e67c73", // Flamingo
        "5": "#f6bf26", // Banana
        "6": "#f4511e", // Tangerine
        "7": "#039be5", // Peacock
        "8": "#616161", // Graphite
        "9": "#3f51b5", // Blueberry
        "10": "#0b8043", // Basil
        "11": "#d50000", // Tomato
    };
    return map[colorId] || "#4285f4";
}
