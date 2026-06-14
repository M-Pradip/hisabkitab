"use client";

import { useMemo, useState } from "react";

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export default function AssignmentGrid({
  participants = [],
  items = [],
  assignments = {},
  onToggleAssignment,
}) {
  const [activePersonId, setActivePersonId] = useState(null);
  const palette = ["#e07b54", "#5b9bd5", "#a855c8", "#3aaa6e", "#f4a728"];

  const activePerson = useMemo(() => {
    if (!participants.length) {
      return null;
    }

    return (
      participants.find((participant) => participant.id === activePersonId) ||
      participants[0] ||
      null
    );
  }, [participants, activePersonId]);

  return (
    <>
      <div className="people-row">
        {participants.map((participant, index) => {
          const active = activePerson?.id === participant.id;
          const initials = participant.name.trim().charAt(0).toUpperCase();

          return (
            <button
              key={participant.id}
              type="button"
              onClick={() => setActivePersonId(active ? null : participant.id)}
              className={`chip ${active ? "chip-active" : ""}`}
              style={{ "--c": palette[index % palette.length] }}
            >
              <span className="chip-initial">{initials}</span>
              <span className="chip-name">{participant.name}</span>
            </button>
          );
        })}
      </div>

      <div className="items-card">
        {items.length ? items.map((item, index) => {
          const selected = assignments[item.id] || [];

          return (
            <div
              key={item.id}
              className={`item-row ${index < items.length - 1 ? "item-border" : ""}`}
            >
              <div className="item-top">
                <div className="item-name-wrap">
                  <span className="item-name">{item.name}</span>
                </div>
                <span className="item-price">{formatMoney(item.price)}</span>
              </div>

              <div className="avatar-row">
                {participants.map((participant) => {
                  const checked = selected.includes(participant.id);
                  const initials = participant.name.trim().charAt(0).toUpperCase();

                  return (
                    <label
                      key={participant.id}
                      className={`avatar ${checked ? "avatar-on" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleAssignment(item.id, participant.id)}
                        className="sr-only"
                      />
                      <span className="av-initial">{initials}</span>
                      <span className="av-name">{participant.name}</span>
                    </label>
                  );
                })}
              </div>

              {activePerson ? (
                <button
                  type="button"
                  className="mt-3 text-left text-xs font-semibold text-[#1c1c40]"
                  onClick={() => onToggleAssignment(item.id, activePerson.id)}
                >
                  Tap to toggle {activePerson.name}
                </button>
              ) : null}
            </div>
          );
        }) : (
          <div className="px-4 py-8 text-center text-sm text-[#8e8ea0]">
            Add items above to start assigning them to participants.
          </div>
        )}
      </div>
    </>
  );
}
