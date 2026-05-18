/* ==========================================================
   SURVIVING TALAMH — Admin Panel
   - Email/password auth (Matthew only)
   - Lists pending and approved fan art / comments
   - Approve, unapprove, and delete actions
   ========================================================== */

(function () {
  const cfg = window.ST_CONFIG || {};

  if (
    !cfg.SUPABASE_URL ||
    !cfg.SUPABASE_ANON_KEY ||
    cfg.SUPABASE_URL.startsWith("REPLACE") ||
    cfg.SUPABASE_ANON_KEY.startsWith("REPLACE")
  ) {
    alert("Supabase not configured. Edit js/config.js with your project URL and anon key.");
    return;
  }

  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const BUCKET = cfg.STORAGE_BUCKET || "fan-art";

  // --- DOM refs ---
  const loginPanel = document.getElementById("login-panel");
  const dashPanel = document.getElementById("dashboard-panel");
  const loginForm = document.getElementById("login-form");
  const loginStatus = document.getElementById("login-status");
  const logoutBtn = document.getElementById("logout-btn");
  const tabs = document.querySelectorAll(".admin-tab");
  const panels = document.querySelectorAll(".admin-tab-panel");

  // --- Helpers ---
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
    } catch (e) { return ""; }
  }

  function setStatus(el, msg, kind) {
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("is-success", "is-error", "is-loading");
    if (kind) el.classList.add(`is-${kind}`);
  }

  // --- Auth ---
  async function checkSession() {
    const { data: { session } } = await sb.auth.getSession();
    if (session) showDashboard();
    else showLogin();
  }

  function showLogin() {
    loginPanel.hidden = false;
    dashPanel.hidden = true;
    logoutBtn.hidden = true;
  }

  function showDashboard() {
    loginPanel.hidden = true;
    dashPanel.hidden = false;
    logoutBtn.hidden = false;
    loadAll();
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    setStatus(loginStatus, "Signing in…", "loading");

    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(loginStatus, error.message || "Sign-in failed.", "error");
      return;
    }
    setStatus(loginStatus, "", null);
    showDashboard();
  });

  logoutBtn.addEventListener("click", async () => {
    await sb.auth.signOut();
    showLogin();
  });

  // --- Tabs ---
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("is-active"));
      panels.forEach(p => p.classList.remove("is-active"));
      tab.classList.add("is-active");
      const panel = document.getElementById(`tab-${tab.dataset.tab}`);
      if (panel) panel.classList.add("is-active");
    });
  });

  // --- Data loading ---
  async function loadAll() {
    await Promise.all([
      loadPendingArt(),
      loadPendingComments(),
      loadApprovedArt(),
      loadApprovedComments()
    ]);
  }

  async function loadPendingArt() {
    const target = document.getElementById("pending-art-list");
    const count = document.getElementById("count-pending-art");
    const { data, error } = await sb
      .from("fan_art")
      .select("id, artist_name, image_url, description, created_at, storage_path")
      .eq("approved", false)
      .order("created_at", { ascending: false });

    if (error) { target.innerHTML = `<p class="admin-empty">Error: ${escapeHtml(error.message)}</p>`; return; }
    count.textContent = (data || []).length;
    if (!data || !data.length) { target.innerHTML = `<p class="admin-empty">Nothing pending.</p>`; return; }
    target.innerHTML = data.map(item => renderArtItem(item, "pending")).join("");
    bindArtActions(target);
  }

  async function loadApprovedArt() {
    const target = document.getElementById("approved-art-list");
    const { data, error } = await sb
      .from("fan_art")
      .select("id, artist_name, image_url, description, created_at, storage_path")
      .eq("approved", true)
      .order("created_at", { ascending: false });

    if (error) { target.innerHTML = `<p class="admin-empty">Error: ${escapeHtml(error.message)}</p>`; return; }
    if (!data || !data.length) { target.innerHTML = `<p class="admin-empty">No approved artwork yet.</p>`; return; }
    target.innerHTML = data.map(item => renderArtItem(item, "approved")).join("");
    bindArtActions(target);
  }

  async function loadPendingComments() {
    const target = document.getElementById("pending-comments-list");
    const count = document.getElementById("count-pending-comments");
    const { data, error } = await sb
      .from("comments")
      .select("id, author_name, message, created_at")
      .eq("approved", false)
      .order("created_at", { ascending: false });

    if (error) { target.innerHTML = `<p class="admin-empty">Error: ${escapeHtml(error.message)}</p>`; return; }
    count.textContent = (data || []).length;
    if (!data || !data.length) { target.innerHTML = `<p class="admin-empty">Nothing pending.</p>`; return; }
    target.innerHTML = data.map(item => renderCommentItem(item, "pending")).join("");
    bindCommentActions(target);
  }

  async function loadApprovedComments() {
    const target = document.getElementById("approved-comments-list");
    const { data, error } = await sb
      .from("comments")
      .select("id, author_name, message, created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false });

    if (error) { target.innerHTML = `<p class="admin-empty">Error: ${escapeHtml(error.message)}</p>`; return; }
    if (!data || !data.length) { target.innerHTML = `<p class="admin-empty">No approved comments yet.</p>`; return; }
    target.innerHTML = data.map(item => renderCommentItem(item, "approved")).join("");
    bindCommentActions(target);
  }

  // --- Renderers ---
  function renderArtItem(item, state) {
    const approveBtn = state === "pending"
      ? `<button class="btn btn-small btn-approve" data-action="approve-art" data-id="${item.id}">Approve</button>`
      : `<button class="btn btn-small btn-ghost" data-action="unapprove-art" data-id="${item.id}">Unapprove</button>`;

    return `
      <div class="admin-item">
        <img class="admin-item-thumb" src="${escapeHtml(item.image_url)}" alt="" />
        <div class="admin-item-body">
          <p class="admin-item-meta">
            ${escapeHtml(item.artist_name)}
            <time>${formatDate(item.created_at)}</time>
          </p>
          ${item.description ? `<p class="admin-item-text">${escapeHtml(item.description)}</p>` : ""}
          <div class="admin-item-actions">
            ${approveBtn}
            <button class="btn btn-small btn-reject" data-action="delete-art" data-id="${item.id}" data-path="${escapeHtml(item.storage_path || "")}">Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderCommentItem(item, state) {
    const approveBtn = state === "pending"
      ? `<button class="btn btn-small btn-approve" data-action="approve-comment" data-id="${item.id}">Approve</button>`
      : `<button class="btn btn-small btn-ghost" data-action="unapprove-comment" data-id="${item.id}">Unapprove</button>`;

    return `
      <div class="admin-item">
        <div class="admin-item-body">
          <p class="admin-item-meta">
            ${escapeHtml(item.author_name)}
            <time>${formatDate(item.created_at)}</time>
          </p>
          <p class="admin-item-text">${escapeHtml(item.message)}</p>
          <div class="admin-item-actions">
            ${approveBtn}
            <button class="btn btn-small btn-reject" data-action="delete-comment" data-id="${item.id}">Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  // --- Actions ---
  function bindArtActions(container) {
    container.querySelectorAll("button[data-action]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const path = btn.dataset.path;
        btn.disabled = true;
        try {
          if (action === "approve-art") {
            await sb.from("fan_art").update({ approved: true }).eq("id", id);
          } else if (action === "unapprove-art") {
            await sb.from("fan_art").update({ approved: false }).eq("id", id);
          } else if (action === "delete-art") {
            if (!confirm("Permanently delete this artwork?")) { btn.disabled = false; return; }
            if (path) await sb.storage.from(BUCKET).remove([path]);
            await sb.from("fan_art").delete().eq("id", id);
          }
          await Promise.all([loadPendingArt(), loadApprovedArt()]);
        } catch (err) {
          alert("Action failed: " + (err.message || "unknown error"));
          btn.disabled = false;
        }
      });
    });
  }

  function bindCommentActions(container) {
    container.querySelectorAll("button[data-action]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        btn.disabled = true;
        try {
          if (action === "approve-comment") {
            await sb.from("comments").update({ approved: true }).eq("id", id);
          } else if (action === "unapprove-comment") {
            await sb.from("comments").update({ approved: false }).eq("id", id);
          } else if (action === "delete-comment") {
            if (!confirm("Permanently delete this comment?")) { btn.disabled = false; return; }
            await sb.from("comments").delete().eq("id", id);
          }
          await Promise.all([loadPendingComments(), loadApprovedComments()]);
        } catch (err) {
          alert("Action failed: " + (err.message || "unknown error"));
          btn.disabled = false;
        }
      });
    });
  }

  // --- Boot ---
  checkSession();
})();
