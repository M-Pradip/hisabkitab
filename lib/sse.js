const GLOBAL_SUBSCRIBERS_KEY = "__hisabkitab_sse_subscribers__";

function getSubscribers() {
  if (!globalThis[GLOBAL_SUBSCRIBERS_KEY]) {
    globalThis[GLOBAL_SUBSCRIBERS_KEY] = new Map();
  }

  return globalThis[GLOBAL_SUBSCRIBERS_KEY];
}

function getSubscriberSet(sessionId) {
  const subscribers = getSubscribers();

  if (!subscribers.has(sessionId)) {
    subscribers.set(sessionId, new Set());
  }

  return subscribers.get(sessionId);
}

export function broadcastSession(sessionId, payload) {
  const subscribers = getSubscribers();
  const subscriberSet = subscribers.get(sessionId);

  if (!subscriberSet || subscriberSet.size === 0) {
    return;
  }

  const message = `data: ${JSON.stringify(payload)}\n\n`;

  for (const send of subscriberSet) {
    try {
      send(message);
    } catch {
      subscriberSet.delete(send);
    }
  }

  if (subscriberSet.size === 0) {
    subscribers.delete(sessionId);
  }
}

export function createSessionStream(sessionId) {
  const encoder = new TextEncoder();
  let heartbeat = null;
  let send = null;

  return new ReadableStream({
    start(controller) {
      send = (chunk) => controller.enqueue(encoder.encode(chunk));
      getSubscriberSet(sessionId).add(send);
      send(": connected\n\n");

      heartbeat = setInterval(() => {
        try {
          send(": ping\n\n");
        } catch {
          // Ignore heartbeat failures; the stream will close shortly after.
        }
      }, 25000);
    },
    cancel() {
      if (heartbeat) {
        clearInterval(heartbeat);
      }

      const subscribers = getSubscribers();
      const subscriberSet = subscribers.get(sessionId);

      if (subscriberSet && send) {
        subscriberSet.delete(send);

        if (subscriberSet.size === 0) {
          subscribers.delete(sessionId);
        }
      }
    },
  });
}
