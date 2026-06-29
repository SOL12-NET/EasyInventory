"use client";

import { MapPin, CheckCircle2, CircleOff, PackagePlus } from "lucide-react";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { can } from "@/lib/permissions";
import { type Role, type Locale, type InventoryState, type Location } from "@/lib/types";

export function LocationsView({
  locale,
  role,
  state,
  onUpdateLocation,
  onAddLocation,
}: {
  locale: Locale;
  role: Role;
  state: InventoryState;
  onUpdateLocation: (id: string, patch: Partial<Location>) => void;
  onAddLocation: (name: string, notes: string) => void;
}) {
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationNotes, setNewLocationNotes] = useState("");

  return (
    <section className="locations-admin">
      <div className="panel">
        <div className="panel-title"><MapPin size={18} /><h3>{t(locale, "locations")}</h3></div>
        <div className="location-admin-list">
          {state.locations.map((location) => (
            <article key={location.id} className={`location-admin-card ${!location.active ? "inactive" : ""}`}>
              <div className="location-admin-head">
                <div>
                  <strong>{location.name}</strong>
                  <span>{state.items.filter((item) => item.locationId === location.id).length} {t(locale, "itemCount")}</span>
                </div>
                <button
                  className={`status-button ${location.active ? "active" : ""}`}
                  disabled={!can(role, "edit:locations")}
                  onClick={() => onUpdateLocation(location.id, { active: !location.active })}
                  type="button"
                >
                  {location.active ? <CheckCircle2 size={16} /> : <CircleOff size={16} />}
                  {location.active ? t(locale, "active") : t(locale, "inactive")}
                </button>
              </div>
              <label>
                {t(locale, "locationName")}
                <input
                  disabled={!can(role, "edit:locations")}
                  value={location.name}
                  onChange={(event) => onUpdateLocation(location.id, { name: event.target.value })}
                />
              </label>
              <label>
                {t(locale, "locationNotes")}
                <textarea
                  disabled={!can(role, "edit:locations")}
                  value={location.notes}
                  onChange={(event) => onUpdateLocation(location.id, { notes: event.target.value })}
                />
              </label>
            </article>
          ))}
        </div>
      </div>
      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault();
          if (!can(role, "edit:locations")) return;
          onAddLocation(newLocationName, newLocationNotes);
          setNewLocationName("");
          setNewLocationNotes("");
        }}
      >
        <div className="panel-title"><PackagePlus size={18} /><h3>{t(locale, "addLocation")}</h3></div>
        <label>
          {t(locale, "locationName")}
          <input disabled={!can(role, "edit:locations")} value={newLocationName} onChange={(event) => setNewLocationName(event.target.value)} placeholder="Paris Nord" />
        </label>
        <label>
          {t(locale, "locationNotes")}
          <textarea disabled={!can(role, "edit:locations")} value={newLocationNotes} onChange={(event) => setNewLocationNotes(event.target.value)} placeholder="Stock, showroom, atelier..." />
        </label>
        {!can(role, "edit:locations") && <p className="permission-note">{t(locale, "disabledByRole")}</p>}
        <button className="primary-button wide" disabled={!can(role, "edit:locations")} type="submit">{t(locale, "create")}</button>
      </form>
    </section>
  );
}
