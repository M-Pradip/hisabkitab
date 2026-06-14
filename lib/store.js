const GLOBAL_SESSION_STORE_KEY = "__hisabkitab_session_store__";

function getStore() {
  if (!globalThis[GLOBAL_SESSION_STORE_KEY]) {
    globalThis[GLOBAL_SESSION_STORE_KEY] = new Map();
  }

  return globalThis[GLOBAL_SESSION_STORE_KEY];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function text(value) {
  return String(value || "").trim();
}

function normalizeParticipant(participant) {
  const name = text(participant?.name);

  if (!name) {
    return null;
  }

  return {
    id: participant?.id || crypto.randomUUID(),
    name,
    role: participant?.role || "participant",
  };
}

function normalizeItem(item) {
  const name = text(item?.name);
  const price = Number(item?.price);

  if (!name || Number.isNaN(price) || price < 0) {
    return null;
  }

  return {
    id: item?.id || crypto.randomUUID(),
    name,
    price: Math.round(price * 100) / 100,
  };
}

function normalizeClaims(claims, participants, items) {
  const participantIds = new Set(participants.map((participant) => participant.id));
  const itemIds = new Set(items.map((item) => item.id));
  const normalized = {};

  for (const item of items) {
    const rawIds = Array.isArray(claims?.[item.id]) ? claims[item.id] : [];

    normalized[item.id] = [...new Set(rawIds)].filter((participantId) =>
      participantIds.has(participantId)
    );
  }

  for (const itemId of itemIds) {
    if (!normalized[itemId]) {
      normalized[itemId] = [];
    }
  }

  return normalized;
}

function buildSession({ id, createdAt, data = {} }) {
  const participants = (data.participants || [])
    .map(normalizeParticipant)
    .filter(Boolean);
  const items = (data.items || []).map(normalizeItem).filter(Boolean);
  const hostId = text(data.hostId) || participants.find((participant) => participant.role === "host")?.id || "";

  const normalizedParticipants = participants.map((participant) => ({
    ...participant,
    role:
      participant.id === hostId || participant.role === "host" ? "host" : "participant",
  }));

  return {
    id,
    hostId,
    hostName: text(data.hostName),
    sessionNote: text(data.sessionNote),
    paymentMethod: text(data.paymentMethod) || "eSewa",
    participants: normalizedParticipants,
    items,
    claims: normalizeClaims(data.claims, normalizedParticipants, items),
    createdAt,
    updatedAt: new Date().toISOString(),
  };
}

export function createSession() {
  const store = getStore();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const session = buildSession({
    id,
    createdAt,
    data: {},
  });

  store.set(id, session);
  return clone(session);
}

export function getSession(id) {
  const store = getStore();
  const session = store.get(id);

  return session ? clone(session) : null;
}

function upsertHost(session, hostName, sessionNote, paymentMethod) {
  const nextHostName = text(hostName) || session.hostName;
  let hostId = session.hostId;
  let participants = [...session.participants];

  if (!hostId) {
    hostId = crypto.randomUUID();
    participants = [
      {
        id: hostId,
        name: nextHostName,
        role: "host",
      },
      ...participants.filter((participant) => participant.role !== "host"),
    ];
  } else {
    participants = participants.map((participant) =>
      participant.id === hostId
        ? { ...participant, name: nextHostName, role: "host" }
        : participant
    );
  }

  return {
    ...session,
    hostId,
    hostName: nextHostName,
    sessionNote: text(sessionNote) || session.sessionNote,
    paymentMethod: text(paymentMethod) || session.paymentMethod,
    participants,
    claims: normalizeClaims(session.claims, participants, session.items),
  };
}

function addParticipant(session, name) {
  const nextName = text(name);

  if (!nextName) {
    return session;
  }

  return {
    ...session,
    participants: [
      ...session.participants,
      {
        id: crypto.randomUUID(),
        name: nextName,
        role: "participant",
      },
    ],
  };
}

function removeParticipant(session, participantId) {
  const participants = session.participants.filter(
    (participant) => participant.id !== participantId && participant.role !== "host"
  );

  const claims = {};
  for (const item of session.items) {
    const nextIds = (session.claims?.[item.id] || []).filter((id) => id !== participantId);
    claims[item.id] = nextIds;
  }

  return {
    ...session,
    participants,
    claims,
  };
}

function addItem(session, item) {
  const normalized = normalizeItem(item);

  if (!normalized) {
    return session;
  }

  return {
    ...session,
    items: [...session.items, normalized],
    claims: {
      ...session.claims,
      [normalized.id]: session.claims?.[normalized.id] || [],
    },
  };
}

function toggleClaim(session, itemId, participantId) {
  if (!itemId || !participantId) {
    return session;
  }

  const current = Array.isArray(session.claims?.[itemId]) ? session.claims[itemId] : [];
  const nextIds = current.includes(participantId)
    ? current.filter((id) => id !== participantId)
    : [...current, participantId];

  return {
    ...session,
    claims: {
      ...session.claims,
      [itemId]: nextIds,
    },
  };
}

export function applySessionAction(id, action = {}) {
  const store = getStore();
  const current = store.get(id);

  if (!current) {
    return null;
  }

  let nextSession = clone(current);

  switch (action.type) {
    case "set_host":
      nextSession = upsertHost(
        nextSession,
        action.hostName,
        action.sessionNote,
        action.paymentMethod
      );
      break;
    case "add_participant":
      nextSession = addParticipant(nextSession, action.name);
      break;
    case "remove_participant":
      nextSession = removeParticipant(nextSession, action.participantId);
      break;
    case "add_item":
      nextSession = addItem(nextSession, action.item);
      break;
    case "toggle_claim":
      nextSession = toggleClaim(nextSession, action.itemId, action.participantId);
      break;
    case "replace_session":
      nextSession = buildSession({
        id,
        createdAt: current.createdAt,
        data: action.session || current,
      });
      break;
    default:
      break;
  }

  nextSession.claims = normalizeClaims(nextSession.claims, nextSession.participants, nextSession.items);
  nextSession.updatedAt = new Date().toISOString();

  store.set(id, nextSession);
  return clone(nextSession);
}
