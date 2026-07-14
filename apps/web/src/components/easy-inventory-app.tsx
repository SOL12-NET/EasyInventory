"use client";

import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  Layers3,
  LockKeyhole,
  MapPin,
  Menu,
  Moon,
  PackagePlus,
  ShieldCheck,
  Sparkles,
  Sun,
  Warehouse,
  X,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { InventoryCardsView } from "@/components/inventory-cards-view";
import { DashboardView, type View } from "@/components/dashboard-view";
import { LogsView } from "@/components/logs-view";
import { DocumentationView } from "@/components/documentation-view";

import { LocationsView } from "@/components/locations-view";
import { AccountsView } from "@/components/accounts-view";
import { OperatorView } from "@/components/operator-view";
import { cloneDemoState, summarizeInventory } from "@/lib/inventory";
import { t } from "@/lib/i18n";
import { roleLabel, can } from "@/lib/permissions";
import { type InventoryState, type Item, type Locale, type Role, type Location, type Account } from "@/lib/types";
import {
  getInventoryStateAction,
  verifyCredentialsAction,
  updateItemAction,
  createItemAction,
  updateLocationAction,
  addLocationAction,
  addPhotosToItemAction,
  setFrontPhotoAction,
  deactivatePhotoAction,
  resetDemoAction,
  createAccountAction,
  deleteAccountAction,
  changePasswordAction,
  logoutAction,
} from "@/app/actions";

const themeStorageKey = "easyinventory.saas.theme";
const roleStorageKey = "easyinventory.saas.demo-role";
const sidebarWidthStorageKey = "easyinventory.saas.sidebar-width";
const sidebarCollapsedStorageKey = "easyinventory.saas.sidebar-collapsed";
const activeAccountStorageKey = "easyinventory.saas.active-account-id";
const activeLocationStorageKey = "easyinventory.saas.operator-active-location";

export function EasyInventoryApp({ initialView = "dashboard" }: { initialView?: string }) {
  const [state, setState] = useState<InventoryState>(() => cloneDemoState());
  const [ready, setReady] = useState(false);
  const [locale, setLocale] = useState<Locale>("fr");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [view, setView] = useState<View>(isView(initialView) ? initialView : "dashboard");
  const [dashboardLocationFilter, setDashboardLocationFilter] = useState("all");
  const [statusChartMode, setStatusChartMode] = useState<"lines" | "pie">("lines");
  const [selectedId, setSelectedId] = useState("item-1001");
  const [inventoryResetSignal, setInventoryResetSignal] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);

  // Operator session active states
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [activeLocationId, setActiveLocationId] = useState<string>("");
  const [userSwitcherOpen, setUserSwitcherOpen] = useState(false);
  const [authLogin, setAuthLogin] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState(false);
  const [demoPasswords, setDemoPasswords] = useState<Record<string, string>>({});

  // Sidebar sizing & collapse state
  const [sidebarWidth, setSidebarWidth] = useState(286);
  const [collapsed, setCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Resolve current active account details
  const activeAccount = useMemo(() => {
    const defaultAcc = state.accounts?.find(a => a.role === "manager") || state.accounts?.[0];
    return state.accounts?.find((a) => a.id === activeAccountId) ?? defaultAcc ?? {
      id: "acc-manager",
      name: "Manager Général",
      role: "manager" as Role,
      locationIds: [],
    };
  }, [state.accounts, activeAccountId]);

  // Initialize and load state from server
  useEffect(() => {
    let active = true;
    async function init() {
      let loadedState = state;
      let sessionAccountId: string | null = null;
      try {
        const response = await getInventoryStateAction();
        if (active) {
          setState(response.state);
          loadedState = response.state;
          sessionAccountId = response.activeAccountId;
          if (response.demoPasswords) {
            setDemoPasswords(response.demoPasswords);
          }
        }
      } catch (err) {
        console.error("Failed to load server state:", err);
      }

      try {
        const savedTheme = window.localStorage.getItem(themeStorageKey);
        const savedWidth = window.localStorage.getItem(sidebarWidthStorageKey);
        const savedCollapsed = window.localStorage.getItem(sidebarCollapsedStorageKey);
        const savedLocationId = window.localStorage.getItem(activeLocationStorageKey);
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        if (active) {
          setTheme(savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light");
          if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
          if (savedCollapsed) setCollapsed(savedCollapsed === "true");

          // Resolve active account from server session
          const accountsList = loadedState.accounts || [];
          const matchedAcc = accountsList.find((a) => a.id === sessionAccountId);
          
          if (matchedAcc) {
            setActiveAccountId(matchedAcc.id);
            
            // Set operator view as default if they log in as operator
            if (matchedAcc.role === "operator") {
              setView("inventory");
            }

            // Resolve location for operator
            const allowedLocIds = matchedAcc.locationIds || [];
            const activeLoc = loadedState.locations.find((l) => l.active && (allowedLocIds.length === 0 || allowedLocIds.includes(l.id)));
            const matchedLocId = allowedLocIds.includes(savedLocationId || "") ? savedLocationId : activeLoc?.id;
            if (matchedLocId) {
              setActiveLocationId(matchedLocId);
            }
          } else {
            setActiveAccountId(null);
            setUserSwitcherOpen(true);
          }
        }
      } catch {
        if (active) setStorageError(true);
      } finally {
        if (active) setReady(true);
      }
    }
    init();

    return () => {
      active = false;
    };
  }, []);

  // Save theme and active account in localStorage
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (!ready) return;
    try {
      window.localStorage.setItem(themeStorageKey, theme);
      if (activeAccountId) {
        window.localStorage.setItem(activeAccountStorageKey, activeAccountId);
      }
      if (activeLocationId) {
        window.localStorage.setItem(activeLocationStorageKey, activeLocationId);
      }
    } catch {
      setStorageError(true);
    }
  }, [ready, theme, activeAccountId, activeLocationId]);

  // Save sidebar configuration in localStorage
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(sidebarWidthStorageKey, String(sidebarWidth));
      window.localStorage.setItem(sidebarCollapsedStorageKey, String(collapsed));
    } catch {
      setStorageError(true);
    }
  }, [ready, sidebarWidth, collapsed]);

  // Keyboard shortcut Ctrl+\ to collapse/expand sidebar
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "\\") {
        event.preventDefault();
        setCollapsed((current) => !current);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (userSwitcherOpen) {
      setAuthLogin("");
      setAuthPassword("");
      setAuthError(false);
    }
  }, [userSwitcherOpen]);

  function startResizing(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsResizing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleResize(event: React.PointerEvent<HTMLDivElement>) {
    if (!isResizing) return;
    const newWidth = event.clientX;
    if (newWidth < 140) {
      setCollapsed(true);
      setSidebarWidth(180);
    } else {
      setCollapsed(false);
      setSidebarWidth(Math.min(450, Math.max(180, newWidth)));
    }
  }

  function stopResizing(event: React.PointerEvent<HTMLDivElement>) {
    setIsResizing(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  const selectedItem = state.items.find((item) => item.id === selectedId) ?? state.items[0] ?? null;
  const summary = useMemo(() => summarizeInventory(state, dashboardLocationFilter), [state, dashboardLocationFilter]);

  async function handleUpdateItem(id: string, patch: Partial<Item>, action = "EDIT_ITEM") {
    try {
      const nextState = await updateItemAction(id, patch, action);
      setState(nextState);
    } catch {
      setStorageError(true);
    }
  }

  async function setItemPatch(patch: Partial<Item>, action = "EDIT_ITEM") {
    const targetId = selectedId || selectedItem?.id;
    if (!targetId) return;
    await handleUpdateItem(targetId, patch, action);
  }

  async function handleAccountPasswordChange(accountId: string, newPassword: string) {
    try {
      const nextState = await changePasswordAction(accountId, newPassword);
      setState(nextState);
    } catch {
      setStorageError(true);
    }
  }

  async function handlePasswordChange(newPassword: string) {
    if (!activeAccountId) return;
    await handleAccountPasswordChange(activeAccountId, newPassword);
  }

  async function handleNewItem() {
    const locationId = state.locations.find((location) => location.active)?.id;
    if (!locationId) return;
    try {
      const nextState = await createItemAction(locationId);
      setState(nextState);
      setSelectedId(nextState.items[0]?.id ?? selectedId);
      setInventoryResetSignal((value) => value + 1);
      setView("inventory");
    } catch {
      setStorageError(true);
    }
  }

  async function handleCreateItemForLocation(locationId: string): Promise<string | undefined> {
    try {
      const nextState = await createItemAction(locationId);
      setState(nextState);
      setSelectedId(nextState.items[0]?.id ?? selectedId);
      setInventoryResetSignal((value) => value + 1);
      return nextState.items[0]?.id;
    } catch {
      setStorageError(true);
    }
  }

  async function uploadPhotosForItem(itemId: string, filesList: FileList | File[]) {
    const files = Array.from(filesList);
    const itemToUpdate = state.items.find((item) => item.id === itemId);
    if (!files.length || !itemToUpdate || !can(activeAccount.role, "add:photos")) return;
    try {
      const photoPayloads = await Promise.all(
        files.map((file) =>
          new Promise<{ url: string; originalName: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ url: String(reader.result), originalName: file.name });
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
        )
      );
      const nextState = await addPhotosToItemAction(itemId, photoPayloads);
      setState(nextState);
    } catch {
      setStorageError(true);
    }
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    if (!selectedItem) return;
    await uploadPhotosForItem(selectedItem.id, event.target.files ?? []);
    event.target.value = "";
  }

  async function handleSetFrontPhoto(itemId: string, photoId: string) {
    try {
      const nextState = await setFrontPhotoAction(itemId, photoId);
      setState(nextState);
    } catch {
      setStorageError(true);
    }
  }

  async function handleDeactivatePhoto(itemId: string, photoId: string) {
    try {
      const nextState = await deactivatePhotoAction(itemId, photoId);
      setState(nextState);
    } catch {
      setStorageError(true);
    }
  }

  async function handleUpdateLocation(locationId: string, patch: Partial<Location>) {
    try {
      const nextState = await updateLocationAction(locationId, patch);
      setState(nextState);
    } catch {
      setStorageError(true);
    }
  }

  async function handleAddLocation(name: string, notes: string) {
    try {
      const nextState = await addLocationAction(name, notes);
      setState(nextState);
    } catch {
      setStorageError(true);
    }
  }

  async function handleCreateAccount(name: string, locationIds: string[], customPassword?: string) {
    try {
      const nextState = await createAccountAction(name, locationIds, customPassword);
      setState(nextState);
    } catch {
      setStorageError(true);
    }
  }

  async function handleDeleteAccount(accountId: string) {
    try {
      const nextState = await deleteAccountAction(accountId);
      setState(nextState);
      if (activeAccountId === accountId) {
        const defaultAcc = nextState.accounts.find(a => a.role === "manager") || nextState.accounts[0];
        if (defaultAcc) {
          setActiveAccountId(defaultAcc.id);
        }
      }
    } catch {
      setStorageError(true);
    }
  }

  function handleSwitchActiveAccount(accountId: string) {
    const matchedAcc = state.accounts?.find(a => a.id === accountId);
    if (matchedAcc) {
      setActiveAccountId(matchedAcc.id);
      
      if (matchedAcc.role === "operator") {
        const allowedLocs = matchedAcc.locationIds;
        const defaultLocId = allowedLocs[0] || state.locations.find(l => l.active)?.id || "";
        setActiveLocationId(defaultLocId);
        setView("inventory");
      } else {
        setActiveLocationId("");
        setView("dashboard");
      }
    }
    setUserSwitcherOpen(false);
  }

  async function resetDemo() {
    try {
      const nextState = await resetDemoAction();
      setState(nextState);
      setSelectedId(nextState.items[0]?.id ?? "");
      setDashboardLocationFilter("all");
      setInventoryResetSignal((value) => value + 1);
      
      const defaultAcc = nextState.accounts.find(a => a.role === "manager") || nextState.accounts[0];
      if (defaultAcc) {
        setActiveAccountId(defaultAcc.id);
        
        if (defaultAcc.role === "operator") {
          const allowedLocs = defaultAcc.locationIds;
          const defaultLocId = allowedLocs[0] || nextState.locations.find(l => l.active)?.id || "";
          setActiveLocationId(defaultLocId);
          setView("inventory");
        } else {
          setActiveLocationId("");
          setView("dashboard");
        }
      }
    } catch {
      setStorageError(true);
    }
  }

  function navButton(id: View, label: string, icon: React.ReactNode) {
    return (
      <button
        className={`nav-item ${view === id ? "active" : ""}`}
        onClick={() => {
          setView(id);
          setNavOpen(false);
        }}
        type="button"
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  if (!ready) {
    return (
      <main className="loading-shell">
        <Sparkles size={26} />
        <strong>{t(locale, "loadingDemo")}</strong>
      </main>
    );
  }

  // Auto-switch layout if active account is operator
  if (activeAccount.role === "operator") {
    return (
      <div className={`app-shell-operator theme-${theme}`} data-theme={theme}>
        <OperatorView
          locale={locale}
          state={state}
          activeAccount={activeAccount}
          activeLocationId={activeLocationId}
          setActiveLocationId={setActiveLocationId}
          onSwitchUser={async () => {
            await logoutAction();
            setActiveAccountId(null);
            setUserSwitcherOpen(true);
          }}
          onResetDemo={resetDemo}
          onUpdateItem={handleUpdateItem}
          onCreateItem={handleCreateItemForLocation}
          onUploadPhotos={uploadPhotosForItem}
          onChangePassword={handlePasswordChange}
        />

        {userSwitcherOpen && (
          <LoginModal
            locale={locale}
            accounts={state.accounts || []}
            onClose={() => setUserSwitcherOpen(false)}
            stateLocations={state.locations}
            setActiveAccountId={setActiveAccountId}
            setActiveLocationId={setActiveLocationId}
            setView={setView}
            setUserSwitcherOpen={setUserSwitcherOpen}
            demoPasswords={demoPasswords}
          />
        )}
      </div>
    );
  }

  return (
    <main
      className={`app-shell ${isResizing ? "resizing" : ""}`}
      style={{ "--sidebar-width": collapsed ? "0px" : `${sidebarWidth}px` } as any}
    >
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${navOpen ? "open" : ""} ${isResizing ? "resizing" : ""}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-mark"><Warehouse size={22} /></div>
            <div>
              <strong>{t(locale, "appName")}</strong>
              <span>{state.organization.name}</span>
            </div>
          </div>
          <button
            className="sidebar-collapse-btn desktop-only"
            onClick={() => setCollapsed(true)}
            title={locale === "fr" ? "Replier le menu (Ctrl+\\)" : "Collapse sidebar (Ctrl+\\)"}
            type="button"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        <nav>
          {navButton("dashboard", t(locale, "dashboard"), <BarChart3 size={18} />)}
          {navButton("inventory", t(locale, "inventory"), <Layers3 size={18} />)}
          {navButton("logs", t(locale, "logs"), <ActivityIcon size={18} />)}
          {navButton("documentation", t(locale, "documentation"), <BookOpen size={18} />)}
          {navButton("locations", t(locale, "locations"), <MapPin size={18} />)}
          {navButton("accounts", t(locale, "accounts"), <Users size={18} />)}

        </nav>

        <div
          className="sidebar-card"
          onClick={async () => {
            await logoutAction();
            setActiveAccountId(null);
            setUserSwitcherOpen(true);
          }}
          style={{ cursor: "pointer" }}
          title={t(locale, "changeUser")}
        >
          <LockKeyhole size={18} />
          <div>
            <strong>{activeAccount.name}</strong>
            <span>{roleLabel(activeAccount.role)}</span>
          </div>
        </div>
      </aside>

      <div
        className={`sidebar-resizer ${isResizing ? "is-resizing" : ""} ${collapsed ? "collapsed" : ""}`}
        onPointerDown={startResizing}
        onPointerMove={handleResize}
        onPointerUp={stopResizing}
        onPointerCancel={stopResizing}
      />

      <section className="workspace" style={{ alignContent: "start" }}>
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setNavOpen(!navOpen)} type="button" aria-label="Menu">
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {collapsed && (
            <button
              className="icon-button desktop-only expand-sidebar-btn"
              onClick={() => setCollapsed(false)}
              type="button"
              title={locale === "fr" ? "Déployer le menu (Ctrl+\\)" : "Expand sidebar (Ctrl+\\)"}
              style={{ marginRight: "12px" }}
            >
              <Menu size={20} />
            </button>
          )}
          <div>
            <h1>{viewTitle(locale, view)}</h1>
          </div>
          <div className="topbar-actions">
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} aria-label="Language">
              <option value="fr">FR</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
            <button
              className="theme-toggle"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              type="button"
              aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              <span className="theme-toggle-track" aria-hidden="true">
                <Sun className="theme-icon sun-icon" size={16} />
                <Moon className="theme-icon moon-icon" size={16} />
                <span className="theme-toggle-thumb" />
              </span>
            </button>
            {(view === "dashboard" || view === "inventory") && (
              <button className="primary-button" onClick={handleNewItem} type="button">
                <PackagePlus size={18} />
                {t(locale, "newItem")}
              </button>
            )}
          </div>
        </header>

        {view === "dashboard" && (
          <section className="hero-band">
            <div>
              <span className="eyebrow" style={{ fontWeight: 850, fontSize: "0.82rem", letterSpacing: "0.08em" }}>
                {t(locale, "heroEyebrow")}
              </span>
              <h2>{t(locale, "appTagline")}</h2>
            </div>
          </section>
        )}

        {storageError && <p className="alert-note">{t(locale, "localStorageError")}</p>}

        {view === "dashboard" && (
          <DashboardView
            locale={locale}
            state={state}
            summary={summary}
            locationFilter={dashboardLocationFilter}
            setLocationFilter={setDashboardLocationFilter}
            setView={setView}
            chartMode={statusChartMode}
            setChartMode={setStatusChartMode}
          />
        )}

        {view === "inventory" && (
          <InventoryCardsView
            locale={locale}
            state={state}
            role={activeAccount.role}
            setSelectedId={setSelectedId}
            selectedId={selectedId}
            resetSignal={inventoryResetSignal}
            setItemPatch={setItemPatch}
            handlePhoto={handlePhoto}
            setFrontPhoto={handleSetFrontPhoto}
            deactivatePhoto={handleDeactivatePhoto}
          />
        )}

        {view === "logs" && (
          <LogsView
            locale={locale}
            state={state}
            setSelectedId={setSelectedId}
            setView={setView}
          />
        )}

        {view === "documentation" && <DocumentationView />}

        {view === "locations" && (
          <LocationsView
            locale={locale}
            role={activeAccount.role}
            state={state}
            onUpdateLocation={handleUpdateLocation}
            onAddLocation={handleAddLocation}
          />
        )}

        {view === "accounts" && (
          <AccountsView
            locale={locale}
            role={activeAccount.role}
            state={state}
            onCreateAccount={handleCreateAccount}
            onDeleteAccount={handleDeleteAccount}
            onChangePassword={handleAccountPasswordChange}
          />
        )}


      </section>

      {userSwitcherOpen && (
        <LoginModal
          locale={locale}
          accounts={state.accounts || []}
          onClose={() => setUserSwitcherOpen(false)}
          stateLocations={state.locations}
          setActiveAccountId={setActiveAccountId}
          setActiveLocationId={setActiveLocationId}
          setView={setView}
          setUserSwitcherOpen={setUserSwitcherOpen}
          demoPasswords={demoPasswords}
        />
      )}
    </main>
  );
}

function ActivityIcon({ size }: { size: number }) {
  // Simple SVG replacement to avoid importing a different icon under a conflicting name
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-activity"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function isView(value: string): value is View {
  return value === "dashboard" || value === "inventory" || value === "logs" || value === "documentation" || value === "locations" || value === "accounts";
}

function isRole(value: string | null): value is Role {
  return value === "owner" || value === "admin" || value === "manager" || value === "operator";
}

function viewTitle(locale: Locale, view: View) {
  return {
    dashboard: t(locale, "dashboard"),
    inventory: t(locale, "inventory"),
    logs: t(locale, "logs"),
    documentation: t(locale, "documentation"),
    locations: t(locale, "locations"),
    accounts: t(locale, "accounts"),
  }[view];
}

function LoginModal({
  locale,
  accounts,
  onClose,
  stateLocations,
  setActiveAccountId,
  setActiveLocationId,
  setView,
  setUserSwitcherOpen,
  demoPasswords,
}: {
  locale: Locale;
  accounts: Account[];
  onClose: () => void;
  stateLocations: Location[];
  setActiveAccountId: (id: string | null) => void;
  setActiveLocationId: (id: string) => void;
  setView: (view: View) => void;
  setUserSwitcherOpen: (open: boolean) => void;
  demoPasswords: Record<string, string>;
}) {
  const [loginVal, setLoginVal] = useState("");
  const [passwordVal, setPasswordVal] = useState("");
  const [errorMsg, setErrorMsg] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const matchedAcc = await verifyCredentialsAction(loginVal.trim(), passwordVal);
      if (matchedAcc) {
        setActiveAccountId(matchedAcc.id);
        setErrorMsg(false);
        setUserSwitcherOpen(false);
        
        if (matchedAcc.role === "operator") {
          const allowedLocs = matchedAcc.locationIds;
          const defaultLocId = allowedLocs[0] || stateLocations.find(l => l.active)?.id || "";
          setActiveLocationId(defaultLocId);
          setView("inventory");
        } else {
          setActiveLocationId("");
          setView("dashboard");
        }
      } else {
        setErrorMsg(true);
      }
    } catch {
      setErrorMsg(true);
    }
  }

  return (
    <div className="user-switcher-modal-backdrop" onClick={onClose}>
      <form className="user-switcher-modal-content" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <h3>{t(locale, "changeUser")}</h3>
        
        {errorMsg && (
          <p className="alert-note error" style={{ color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "6px", fontSize: "0.9rem", marginBottom: "14px" }}>
            {t(locale, "loginError")}
          </p>
        )}

        <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t(locale, "loginLabel")}</span>
          <input
            type="text"
            value={loginVal}
            onChange={(e) => setLoginVal(e.target.value)}
            placeholder="Ex: jdupont"
            required
            style={{
              height: "44px",
              padding: "0 12px",
              border: "1px solid var(--line)",
              borderRadius: "6px",
              background: "var(--field)",
              color: "var(--ink)",
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t(locale, "passwordLabel")}</span>
          <input
            type="password"
            value={passwordVal}
            onChange={(e) => setPasswordVal(e.target.value)}
            placeholder="••••••••"
            required
            style={{
              height: "44px",
              padding: "0 12px",
              border: "1px solid var(--line)",
              borderRadius: "6px",
              background: "var(--field)",
              color: "var(--ink)",
            }}
          />
        </label>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            className="secondary-button"
            onClick={onClose}
            type="button"
            style={{ flex: 1, height: "44px" }}
          >
            {t(locale, "cancel")}
          </button>
          <button
            className="primary-button"
            type="submit"
            style={{ flex: 1, height: "44px" }}
          >
            Se connecter
          </button>
        </div>

        {/* Demo Accounts Help Block */}
        <div className="login-demo-accounts-help" style={{
          borderTop: "1px dashed var(--line)",
          paddingTop: "12px",
          maxHeight: "180px",
          overflowY: "auto",
          fontSize: "0.82rem",
          color: "var(--muted)"
        }}>
          <span style={{ fontWeight: 700, display: "block", marginBottom: "6px" }}>
            {t(locale, "loginHelpTitle")}
          </span>
          <ul style={{ paddingLeft: "16px", margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
            {accounts?.map((acc) => (
              <li key={acc.id}>
                <strong>{acc.name}</strong> ({roleLabel(acc.role)})<br />
                <span>Login: <code>{acc.login}</code> / Pass: <code>{demoPasswords[acc.login] || "••••••••"}</code></span>
              </li>
            ))}
          </ul>
        </div>
      </form>
    </div>
  );
}
