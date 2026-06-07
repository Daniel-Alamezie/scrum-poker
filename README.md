# Scrum Poker

Real-time planning poker for sprint refinement. Self-hosted, no database, no sign-up. Create a
session, share a link or code, and estimate together while votes stay hidden until the host
reveals them.

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

## Features

- Create a session and share a link or 6 character code
- Everyone votes live; votes stay hidden until the host reveals them
- Two estimation modes, switchable by the host at any time:
  - **Story points** on a Fibonacci scale (1, 2, 3, 5, 8)
  - **Spike** in days (1, 1.5, 2, 2.5, 3)
- On reveal it surfaces the agreed number, or a prompt to discuss when there is no clear winner
- Live indication of who has voted and who the room is still waiting on
- No database. All session state lives in server memory and is gone once everyone leaves
- No accounts. People are identified by the name they type in

## Tech stack

| Concern   | Choice                                            |
| --------- | ------------------------------------------------- |
| Framework | Next.js 15 (App Router)                           |
| Real-time | Socket.io over a custom Node server (`server.ts`) |
| State     | In-memory `Map` on the server, no persistence     |
| UI        | Tailwind CSS                                      |
| Language  | TypeScript                                        |
| Tests     | Vitest                                            |

## Quick start

```bash
git clone https://github.com/Daniel-Alamezie/scrum-poker.git
cd scrum-poker
npm install
npm run dev
```

Open http://localhost:3000. That is it. No environment variables or accounts required.

## Scripts

| Script               | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Start the dev server (Next.js + Socket.io) |
| `npm run build`      | Production build                           |
| `npm start`          | Run the production server                  |
| `npm run lint`       | ESLint                                     |
| `npm run format`     | Prettier write                             |
| `npm run type-check` | TypeScript, no emit                        |
| `npm test`           | Run the unit tests once                    |
| `npm run test:watch` | Run tests in watch mode                    |

## Architecture

The app is a single deployable process. `server.ts` boots Next.js and attaches a Socket.io
server to the same HTTP listener, so the web app and the realtime channel share one port.

```
server.ts                  Custom Node server: Next.js request handler + Socket.io
src/
  server/
    room-manager.ts        All in-memory room state and the rules around it
    room-manager.test.ts   Unit tests for the room logic
    socket-handlers.ts     Maps socket events to room-manager calls
  lib/
    socket.ts              Client hook (useSocket) wrapping the socket connection
    types.ts               Shared types and the Fibonacci / Spike value sets
  components/              React components, styled with Tailwind
    ui/                    Small primitives (Button, Input)
  app/                     Next.js routes (landing page and /room/[code])
```

### How identity and ownership work

There is no login. A person is identified by a `clientId` generated once per browser tab and
kept in `sessionStorage`. This is deliberate: the socket connection changes when the creator
navigates from the landing page into the room, so ownership cannot be tied to a socket id.
The server tracks `creatorClientId` per room and recognises the creator on whichever socket
they reconnect with. Only the creator can reveal votes, clear the round, or change the mode.

### Round lifecycle

1. Participants cast votes. The server records who has voted but keeps the values hidden.
2. The host reveals. All votes become visible and the agreed number (the unique most common
   value) is shown, or an ice-breaker prompt when the room is split.
3. The host clears, which resets the round so everyone can vote again.

Rooms with no participants are removed from memory after a short grace period.

## Theming

The accent colour is defined once as `brand` in `tailwind.config.ts`. Change those values to
re-theme the whole app.

## Deployment

This is a stateful, long-lived Socket.io server with in-memory room state, so it needs a host
that runs a persistent Node process or container. Render, Railway, Fly.io, or any VPS all work.
Serverless platforms such as Vercel are not a fit, because they do not run a custom server or
hold WebSocket state.

With Docker:

```bash
docker build -t scrum-poker .
docker run -p 3000:3000 scrum-poker
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
