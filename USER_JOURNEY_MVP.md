# User Performance Journey

### 🎯 **MVP Target State**

- **Welcome Stage** inviting landing page with a clear message and simple UX, including a way to join a performance right away, or review past performances
- **5-Movement Performance Flow** - structured prompt-response-vote movements. For now, robots respond ASAP. Later we will create realistic timing for the delivery of messages to the viewing area.
- **Performance History** with past results and harmony scores (placeholder for now, build the data behind it soon)

## MVP Performance Flow

```mermaid
flowchart TD
    A[Musician Logs In] --> B[Welcome Stage]
    B --> C[Click Start Test Performance]
    C --> D[Start a Performance with this musician's instrument + 3 robot musicians]
    D --> E[Randomly Assign each instrument/robot to positions A/B/C/D]
    E --> F[Movement 1: Show prompt]
    F --> G[All musicians respond to prompt]
    G --> H[Reveal responses simultaneously]
    H --> I[Vote: Who played which response?]
    I --> J{Movement < 5?}
    J -->|Yes| K[AI summarizes & generates next prompt]
    K --> F
    J -->|No| L[Finale: reveal & harmony scores]
    L --> M[Save to history -- eventually, not in first iteration]
    M --> N[Return to stage]

    style A fill:#e3f2fd
    style C fill:#c8e6c9
    style F fill:#fff8e1
    style G fill:#e8f5e8
    style I fill:#fce4ec
    style L fill:#f3e5f5
```
