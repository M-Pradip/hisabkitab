function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calculateSplits(session) {
  const participants = session?.participants || [];
  const items = session?.items || [];
  const claims = session?.claims || {};
  const participantMap = new Map(
    participants.map((participant) => [
      participant.id,
      {
        id: participant.id,
        name: participant.name,
        role: participant.role || "participant",
        total: 0,
        items: [],
      },
    ]),
  );

  let grandTotal = 0;
  let unassignedTotal = 0;
  const unassignedItems = [];
  const taxAmount = Math.max(0, Number(session?.taxAmount) || 0);

  for (const item of items) {
    const claimedIds = [...new Set(claims[item.id] || [])].filter((id) =>
      participantMap.has(id),
    );
    const price = (Number(item.price) || 0) * (Number(item.quantity) || 1);

    grandTotal += price;

    if (claimedIds.length === 0) {
      unassignedTotal += price;
      unassignedItems.push(item);
      continue;
    }

    const share = price / claimedIds.length;

    for (const participantId of claimedIds) {
      const bucket = participantMap.get(participantId);

      bucket.total += share;
      bucket.items.push({
        id: item.id,
        name: item.name,
        share,
        price,
        claimedIds,
      });
    }
  }

  const participantTax = participants.length
    ? taxAmount / participants.length
    : 0;

  for (const bucket of participantMap.values()) {
    bucket.total += participantTax;
  }

  grandTotal += taxAmount;

  return {
    grandTotal: roundMoney(grandTotal),
    taxAmount: roundMoney(taxAmount),
    participantTax: roundMoney(participantTax),
    unassignedTotal: roundMoney(unassignedTotal),
    unassignedItems,
    hasUnassigned: unassignedItems.length > 0,
    participantTotals: [...participantMap.values()].map((participant) => ({
      ...participant,
      total: roundMoney(participant.total),
    })),
  };
}
