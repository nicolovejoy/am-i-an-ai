# AmIAnAI v2 - 2H+2AI Real-Time Prototype

Minimal implementation of 4-person anonymous conversations (2 humans + 2 AIs).

## Quick Start

```bash
cd v2
npm install
npm test        # Run tests
npm run build   # Build Lambda
```

## Architecture

- **Single WebSocket Lambda** (~300 lines)
- **DynamoDB** for session state (coming)
- **A/B/C/D anonymity** with post-session reveal
- **2 AI participants** with distinct personalities

## Test-Driven Development

All features developed test-first. Run `npm test:watch` while developing.

## Success Metrics

- [ ] < 500 lines of code
- [ ] < $5/month infrastructure
- [ ] Real-time 4-person chat working
- [ ] Users can't identify AIs reliably