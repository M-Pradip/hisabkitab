"use client";

import { useCallback, useEffect, useState } from "react";

export function useSessionState(sessionId) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      return undefined;
    }

    const controller = new AbortController();

    (async () => {
      setStatus("loading");
      setError("");

      try {
        const response = await fetch(`/api/session/${sessionId}`, {
          signal: controller.signal,
        });

        if (response.status === 404) {
          setSession(null);
          setStatus("missing");
          setError("This session could not be found.");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load session.");
        }

        const data = await response.json();
        setSession(data.session);
        setStatus("ready");
      } catch (err) {
        if (err?.name === "AbortError") {
          return;
        }

        setStatus("error");
        setError(err instanceof Error ? err.message : "Unable to load session.");
      }
    })();

    return () => {
      controller.abort();
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      return undefined;
    }

    const eventSource = new EventSource(`/api/session/${sessionId}/events`);

    eventSource.onmessage = (event) => {
      if (!event.data) {
        return;
      }

      try {
        const nextSession = JSON.parse(event.data);
        setSession(nextSession);
        setStatus("ready");
      } catch {
        // Ignore malformed SSE payloads.
      }
    };

    eventSource.onerror = () => {
      setStatus((current) => (current === "ready" ? "reconnecting" : current));
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId]);

  const updateSession = useCallback(
    async (payload) => {
      const response = await fetch(`/api/session/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to save session.");
      }

      const data = await response.json();
      setSession(data.session);
      setStatus("ready");
      return data.session;
    },
    [sessionId]
  );

  return {
    session,
    setSession,
    status,
    error,
    updateSession,
  };
}
