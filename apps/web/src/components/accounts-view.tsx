"use client";

import { Users, Trash2, ShieldAlert, CheckCircle2, UserPlus, Pencil, Check, X, KeyRound } from "lucide-react";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { can } from "@/lib/permissions";
import { type Role, type Locale, type InventoryState } from "@/lib/types";

export function AccountsView({
  locale,
  role,
  state,
  onCreateAccount,
  onDeleteAccount,
  onChangePassword,
}: {
  locale: Locale;
  role: Role;
  state: InventoryState;
  onCreateAccount: (name: string, locationIds: string[], password?: string) => void;
  onDeleteAccount: (id: string) => void;
  onChangePassword: (id: string, newPassword: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingPasswordVal, setEditingPasswordVal] = useState("");
  const isManager = role === "owner" || role === "admin" || role === "manager";

  const operatorAccounts = state.accounts?.filter((acc) => acc.role === "operator") ?? [];
  const activeLocations = state.locations.filter((loc) => loc.active);

  function handleToggleLocation(locId: string) {
    setSelectedLocations((prev) =>
      prev.includes(locId) ? prev.filter((id) => id !== locId) : [...prev, locId]
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim() || !isManager) return;
    onCreateAccount(newName.trim(), selectedLocations, newPassword.trim() || undefined);
    setNewName("");
    setNewPassword("");
    setSelectedLocations([]);
  }

  function handleSavePassword(accId: string) {
    if (!editingPasswordVal.trim() || editingPasswordVal.trim().length < 6) {
      alert(locale === "fr" ? "Le mot de passe doit comporter au moins 6 caractères." : "Password must be at least 6 characters.");
      return;
    }
    onChangePassword(accId, editingPasswordVal.trim());
    setEditingAccountId(null);
    setEditingPasswordVal("");
  }

  return (
    <section className="accounts-admin">
      <div className="panel">
        <div className="panel-title">
          <Users size={18} />
          <h3>{t(locale, "accountsTitle")}</h3>
        </div>
        <p className="section-intro-text">{t(locale, "accountsIntro")}</p>

        {operatorAccounts.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px 20px" }}>
            {t(locale, "noAccount")}
          </div>
        ) : (
          <div className="accounts-list">
            {operatorAccounts.map((account) => (
              <article key={account.id} className="account-admin-card">
                <div className="account-admin-info">
                  <strong>{account.name}</strong>
                  <div style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "4px 0", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
                    <span>{t(locale, "loginLabel")}: <code>{account.login}</code></span>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {t(locale, "passwordLabel")}:{" "}
                      {editingAccountId === account.id ? (
                        <>
                          <input
                            type="text"
                            value={editingPasswordVal}
                            onChange={(e) => setEditingPasswordVal(e.target.value)}
                            style={{
                              height: "26px",
                              padding: "0 6px",
                              fontSize: "0.8rem",
                              width: "100px",
                              border: "1px solid var(--line)",
                              borderRadius: "4px",
                              background: "var(--field)",
                              color: "var(--ink)",
                              outline: "none"
                            }}
                            required
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePassword(account.id)}
                            style={{ background: "transparent", border: "none", color: "var(--primary)", cursor: "pointer", display: "flex", padding: 0 }}
                            title={t(locale, "save")}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingAccountId(null)}
                            style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", display: "flex", padding: 0 }}
                            title={t(locale, "cancel")}
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <code>{account.password}</code>
                          <button
                            type="button"
                            disabled={!isManager}
                            onClick={() => {
                              setEditingAccountId(account.id);
                              setEditingPasswordVal(account.password);
                            }}
                            style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", display: "flex", padding: 0 }}
                            title={locale === "fr" ? "Modifier le mot de passe" : "Edit password"}
                          >
                            <Pencil size={12} />
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="account-locations-badges">
                    {account.locationIds.length === 0 ? (
                      <span className="location-badge empty">{t(locale, "allLocations")}</span>
                    ) : (
                      account.locationIds.map((locId) => {
                        const locName = state.locations.find((l) => l.id === locId)?.name ?? locId;
                        return (
                          <span key={locId} className="location-badge">
                            {locName}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
                <button
                  className="danger-button icon-only"
                  disabled={!isManager}
                  onClick={() => onDeleteAccount(account.id)}
                  type="button"
                  title={t(locale, "deleteAccount")}
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      <form className="panel" onSubmit={handleSubmit}>
        <div className="panel-title">
          <UserPlus size={18} />
          <h3>{t(locale, "createAccount")}</h3>
        </div>
        
        <label>
          {t(locale, "accountName")}
          <input
            disabled={!isManager}
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Ex: Jean Dupont"
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
          <span>{t(locale, "passwordLabel")} ({locale === "fr" ? "optionnel" : "optional"})</span>
          <input
            type="text"
            disabled={!isManager}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder={locale === "fr" ? "Laisser vide pour générer automatiquement" : "Leave blank to auto-generate"}
            minLength={6}
            style={{
              height: "42px",
              padding: "0 12px",
              border: "1px solid var(--line)",
              borderRadius: "6px",
              background: "var(--field)",
              color: "var(--ink)",
            }}
          />
        </label>

        <div className="locations-selector-section">
          <span className="field-label">{t(locale, "assignedLocations")}</span>
          <div className="locations-checkbox-grid">
            {activeLocations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                className={`location-checkbox-btn ${selectedLocations.includes(loc.id) ? "checked" : ""}`}
                disabled={!isManager}
                onClick={() => handleToggleLocation(loc.id)}
              >
                <CheckCircle2 size={16} />
                <span>{loc.name}</span>
              </button>
            ))}
          </div>
        </div>

        {!isManager && (
          <p className="permission-note">
            <ShieldAlert size={14} /> {t(locale, "disabledByRole")}
          </p>
        )}

        <button
          className="primary-button wide"
          disabled={!isManager || !newName.trim()}
          type="submit"
        >
          {t(locale, "create")}
        </button>
      </form>
    </section>
  );
}
