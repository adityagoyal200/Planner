## Bug inventory (working list)

This file is a living bug inventory to drive fixes + regression tests.

### 1) Supabase “backend” is not Cal.com-style
- **Symptom**: Data persistence is a single JSON blob in `planner_state.data` keyed by `user_id` (Google `sub`), written via anon key from browser.
- **Impact**: Not queryable, hard to migrate, easy to silently fail under RLS, cannot guarantee per-user isolation without Supabase Auth.
- **Code**:
  - `src/services/supabase.ts` (`planner_state` upsert/select)
  - `src/store/useScheduleStore.ts` (`getCloudPayload`, `hydrateFromCloud`, sync subscribe)
  - `src/components/auth/LoginScreen.tsx` (Google ID token only, no Supabase Auth session)

### 2) Potential cross-midnight schedule oddities
- **Symptom**: Blocks that cross midnight can create confusing next-day carry-over entries and gaps.
- **Hypothesis**: carry-over blocks (`carryOverForNextDay`) + gap insertion may double-render sleep and/or produce unexpected ordering when `actualStartDate` is used.
- **Code**:
  - `src/engine/computeSchedule.ts` (carry-over conversion + gap insertion)
  - `src/components/schedule/Timeline.tsx` (prev-day carry-over + editable times)

### 3) Sleep logging confusion cases
- **Symptom**: Sleep can still feel “buggy” when user logs times but dates are missing/inconsistent.
- **Current logic**:
  - `SleepAnalysis` infers sleep date relative to wake if times suggest “previous night”.
  - `sleepUtils` falls back to time-inference if dates are inconsistent.
- **Remaining risks**:
  - `actualWakeDate/actualSleepDate` might not be set/cleared consistently across UI interactions.
  - “Yesterday” comparison uses `yesterdayKey` within viewed week, which can confuse when viewing week boundaries (Mon comparing to Sun within same week is not “previous night” historically).
- **Code**:
  - `src/components/schedule/SleepAnalysis.tsx`
  - `src/utils/sleepUtils.ts`

### 4) Completion state perceived as “auto-done”
- **Fact**: In current code, `completed` flips only via explicit button presses:
  - Timeline completion toggle
  - FocusTimer “Complete block” button
- **Possible user-facing confusion**:
  - Week rollover resets completion and may make it look like system did something unexpected.
  - Week browsing saves `state.week` into `weeks[saveKey]` on navigation; if week key mismatch happens, completion may appear to “move”.
- **Code**:
  - `src/components/schedule/Timeline.tsx`
  - `src/components/common/FocusTimer.tsx`
  - `src/store/useScheduleStore.ts` (navigateWeek/saveKey)

### 5) Week navigation vs calendar events mismatch
- **Symptom**: When browsing past weeks, Google events are still fetched for selected date, but Google API returns data only if user has auth and events exist; editing event times currently uses original event datetime and overwrites hours/minutes without changing date.
- **Code**:
  - `src/components/common/CalendarSync.tsx`
  - `src/services/googleCalendar.ts`

### 6) Missing backend enforcement (RLS)
- **Symptom**: current scheme cannot guarantee per-user row isolation in Supabase without Supabase Auth and RLS policies.
- **Fix direction**: normalized domain tables + Supabase Auth (Google provider) + RLS `user_id = auth.uid()`.

