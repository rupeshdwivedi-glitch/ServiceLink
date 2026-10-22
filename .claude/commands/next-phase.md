---
description: Figure out and implement the next piece of ServiceLink's build order, in small steps
---

Check the current state of `backend/app/` and `frontend/src/` against the build order in `CLAUDE.md` (project setup → auth/JWT → services CRUD → bookings → polish/styling).

1. Identify the earliest phase that isn't fully done yet.
2. Propose the next small, incremental piece of that phase (not the whole phase at once) and confirm with the user before writing code, since they're a beginner and prefer step-by-step changes.
3. Implement just that piece, explaining what each part does along the way.

Do not start a later phase (e.g. bookings) before the phases before it are working.
