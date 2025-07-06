# Event-Driven Match Architecture

## 🎯 **Current Architecture**

Simple event flow for match creation and history:

```
Frontend → Match Service → Kafka Events → Match History
```

## 📋 **Event Flow**

1. **Match Creation** - Frontend triggers match service
2. **Event Publishing** - Match service publishes events to Kafka
3. **History Building** - Consumer builds match history from events
4. **Display** - Frontend shows match history

## 🔮 **Future: Robot Orchestration**

Eventually, robots will consume match events and generate responses:

```
Match Events → Robot Consumers → Response Events → Match Updates
```

**For now:** Focus on basic match creation and history flow.

## 📋 **Topics**

- `match-events` - All match lifecycle events
- `robot-commands` - Commands to robots (future)
- `robot-responses` - Robot-generated responses (future)

## 🔧 **Implementation**

**Current:** Match Service → Kafka → History Consumer → API  
**Future:** Add robot consumers that respond to match events
