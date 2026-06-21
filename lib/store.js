import { ensureSchema, sql } from "@/lib/db";
import { destroyCloudinaryImage } from "@/lib/cloudinary";
import {
  getPaymentProviderLabel,
  normalizePaymentProvider,
} from "@/lib/paymentOptions";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function text(value) {
  return String(value || "").trim();
}

function fieldValue(action, key, fallback) {
  if (!Object.prototype.hasOwnProperty.call(action || {}, key)) {
    return fallback;
  }

  return action[key];
}

const SESSION_QR_RETENTION_MS = 30 * 60 * 1000;
const SESSION_CLEANUP_TIMERS_KEY = "__hisabkita_session_cleanup_timers__";

function getCleanupTimers() {
  if (!globalThis[SESSION_CLEANUP_TIMERS_KEY]) {
    globalThis[SESSION_CLEANUP_TIMERS_KEY] = new Map();
  }

  return globalThis[SESSION_CLEANUP_TIMERS_KEY];
}

function toTimestamp(value) {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function shouldCleanupSession(session) {
  return Boolean(
    session?.closedAt &&
      session?.paymentQrPublicId &&
      session?.qrExpiresAt &&
      toTimestamp(session.qrExpiresAt) <= Date.now(),
  );
}

async function removeSessionRow(id) {
  await ensureSchema();

  await sql`
    DELETE FROM sessions
    WHERE id = ${id}
  `;
}

async function cleanupSessionAssets(id, session) {
  if (session?.paymentQrPublicId) {
    try {
      await destroyCloudinaryImage(session.paymentQrPublicId);
    } catch {
      // Best-effort cleanup; continue removing the session record.
    }
  }

  await removeSessionRow(id);
}

function scheduleSessionCleanup(id, session) {
  const expiresAt = toTimestamp(session?.qrExpiresAt);

  if (!expiresAt) {
    return;
  }

  const timers = getCleanupTimers();
  const previousTimer = timers.get(id);

  if (previousTimer) {
    clearTimeout(previousTimer);
  }

  const delay = Math.max(expiresAt - Date.now(), 0);
  const timeout = setTimeout(async () => {
    timers.delete(id);

    try {
      const row = await loadSessionRow(id);

      if (!row?.session || !shouldCleanupSession(row.session)) {
        return;
      }

      await cleanupSessionAssets(id, row.session);
    } catch {
      // Best-effort cleanup; read-time cleanup will retry on the next hit.
    }
  }, delay);

  timers.set(id, timeout);
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
  const paymentProvider = normalizePaymentProvider(
    data.paymentProvider || data.paymentMethod,
  );
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
    paymentProvider,
    paymentMethod: getPaymentProviderLabel(paymentProvider),
    paymentQrImage: text(data.paymentQrImage),
    paymentQrFileName: text(data.paymentQrFileName),
    paymentQrPublicId: text(data.paymentQrPublicId),
    paymentQrAssetId: text(data.paymentQrAssetId),
    closedAt: text(data.closedAt),
    qrExpiresAt: text(data.qrExpiresAt),
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

  if (!row?.session) {
    return null;
  }

  if (shouldCleanupSession(row.session)) {
    await cleanupSessionAssets(id, row.session);
    return null;
  }

  return clone(row.session);
}

function upsertHost(session, action = {}) {
  const nextHostName = text(action.hostName) || session.hostName;
  let hostId = session.hostId;
  let participants = [...session.participants];
  const nextPaymentProvider = normalizePaymentProvider(
    fieldValue(
      action,
      "paymentProvider",
      session.paymentProvider || session.paymentMethod,
    ),
  );
  const nextPaymentQrImage = text(
    fieldValue(action, "paymentQrImage", session.paymentQrImage),
  );
  const nextPaymentQrFileName = text(
    fieldValue(action, "paymentQrFileName", session.paymentQrFileName),
  );
  const nextPaymentQrPublicId = text(
    fieldValue(action, "paymentQrPublicId", session.paymentQrPublicId),
  );
  const nextPaymentQrAssetId = text(
    fieldValue(action, "paymentQrAssetId", session.paymentQrAssetId),
  );

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
    sessionNote: text(action.sessionNote) || session.sessionNote,
    paymentProvider: nextPaymentProvider,
    paymentMethod: getPaymentProviderLabel(nextPaymentProvider),
    paymentQrImage: nextPaymentQrImage,
    paymentQrFileName: nextPaymentQrFileName,
    paymentQrPublicId: nextPaymentQrPublicId,
    paymentQrAssetId: nextPaymentQrAssetId,
    closedAt: text(session.closedAt),
    qrExpiresAt: text(session.qrExpiresAt),
    participants,
    claims: normalizeClaims(session.claims, participants, session.items),
  };
}

function setPaymentQr(session, action = {}) {
  const nextPaymentProvider = normalizePaymentProvider(
    fieldValue(action, "paymentProvider", session.paymentProvider || session.paymentMethod),
  );

  return {
    ...session,
    paymentProvider: nextPaymentProvider,
    paymentMethod: getPaymentProviderLabel(nextPaymentProvider),
    paymentQrImage: text(fieldValue(action, "paymentQrImage", session.paymentQrImage)),
    paymentQrFileName: text(
      fieldValue(action, "paymentQrFileName", session.paymentQrFileName),
    ),
    paymentQrPublicId: text(
      fieldValue(action, "paymentQrPublicId", session.paymentQrPublicId),
    ),
    paymentQrAssetId: text(
      fieldValue(action, "paymentQrAssetId", session.paymentQrAssetId),
    ),
  };
}

function clearPaymentQr(session) {
  return {
    ...session,
    paymentQrImage: "",
    paymentQrFileName: "",
    paymentQrPublicId: "",
    paymentQrAssetId: "",
  };
}

function closeSession(session) {
  const closedAt = new Date().toISOString();

  return {
    ...session,
    closedAt,
    qrExpiresAt: new Date(Date.now() + SESSION_QR_RETENTION_MS).toISOString(),
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

  if (shouldCleanupSession(row.session)) {
    await cleanupSessionAssets(id, row.session);
    return null;
  }

  let nextSession = clone(row.session);
  const previousPaymentQrPublicId = nextSession.paymentQrPublicId;

  switch (action.type) {
    case "set_host":
      nextSession = upsertHost(nextSession, action);
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
    case "set_payment_qr":
      nextSession = setPaymentQr(nextSession, action);
      break;
    case "clear_payment_qr":
      nextSession = clearPaymentQr(nextSession);
      break;
    case "close_session":
      nextSession = closeSession(nextSession);
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

  if (
    action.type === "set_payment_qr" &&
    previousPaymentQrPublicId &&
    previousPaymentQrPublicId !== nextSession.paymentQrPublicId
  ) {
    try {
      await destroyCloudinaryImage(previousPaymentQrPublicId);
    } catch {
      // Old QR deletion is best-effort.
    }
  }

  if (action.type === "close_session") {
    scheduleSessionCleanup(id, nextSession);
  }

  return clone(nextSession);
}

export async function deleteSession(id) {
  const row = await loadSessionRow(id);

  if (row?.session?.paymentQrPublicId) {
    try {
      await destroyCloudinaryImage(row.session.paymentQrPublicId);
    } catch {
      // Best-effort cleanup.
    }
  }

  await removeSessionRow(id);
}
