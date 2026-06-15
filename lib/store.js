import { ensureSchema, sql } from "@/lib/db";

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
  const hostId =
    text(data.hostId) ||
    participants.find((participant) => participant.role === "host")?.id ||
    "";

  const normalizedParticipants = participants.map((participant) => ({
    ...participant,
    role:
      participant.id === hostId || participant.role === "host"
        ? "host"
        : "participant",
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

async function loadSessionRow(id) {
  await ensureSchema();

  const rows = await sql`
    SELECT session, created_at
    FROM sessions
    WHERE id = ${id}
    LIMIT 1
  `;

  return rows[0] || null;
}

async function saveSession(session) {
  await ensureSchema();

  await sql`
    INSERT INTO sessions (id, session, created_at, updated_at)
    VALUES (${session.id}, ${sql.json(session)}, ${session.createdAt}, ${session.updatedAt})
    ON CONFLICT (id)
    DO UPDATE SET
      session = EXCLUDED.session,
      updated_at = EXCLUDED.updated_at
  `;
}

export async function createSession() {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const session = buildSession({
    id,
    createdAt,
    data: {},
  });

  await saveSession(session);
  return clone(session);
}

export async function getSession(id) {
  const row = await loadSessionRow(id);

  return row?.session ? clone(row.session) : null;
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

export async function applySessionAction(id, action = {}) {
  const row = await loadSessionRow(id);

  if (!row?.session) {
    return null;
  }

  let nextSession = clone(row.session);

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
        createdAt: row.session.createdAt,
        data: action.session || row.session,
      });
      break;
    default:
      break;
  }

  nextSession.claims = normalizeClaims(
    nextSession.claims,
    nextSession.participants,
    nextSession.items
  );
  nextSession.updatedAt = new Date().toISOString();

  await saveSession(nextSession);
  return clone(nextSession);
}

export async function deleteSession(id) {
  await ensureSchema();

  await sql`
    DELETE FROM sessions
    WHERE id = ${id}
  `;
}
