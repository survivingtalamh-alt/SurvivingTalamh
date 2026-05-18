/* ==========================================================
   SURVIVING TALAMH — Fan Zone
   - Handles fan art submission (image upload to Storage,
     metadata row to fan_art table, status = pending)
   - Renders approved fan art gallery
   - Handles comment submission (status = pending)
   - Renders approved comments
   ========================================================== */

(function () {
  const sb = window.stSupabase;
  const cfg = window.ST_CONFIG || {};

  // --- Helpers ---
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setStatus(el, msg, kind) {
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("is-success", "is-error", "is-loading");
    if (kind) el.classList.add(`is-${kind}`);
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric"
      });
    } catch (e) { return ""; }
  }

  function disableIfNoBackend() {
    if (sb) return false;
    const banner = "Fan Zone is offline — Supabase isn't configured yet.";
    [
      ["art-status", banner],
      ["comment-status", banner]
    ].forEach(([id, msg]) => {
      const el = document.getElementById(id);
      if (el) setStatus(el, msg, "error");
    });
    document.querySelectorAll("#fan-art-form button, #comment-form button, #fan-art-form input, #fan-art-form textarea, #comment-form input, #comment-form textarea")
      .forEach(el => { el.disabled = true; });
    return true;
  }

  // --- Fan Art Upload ---
  function initFanArtForm() {
    const form = document.getElementById("fan-art-form");
    if (!form) return;
    const status = document.getElementById("art-status");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!sb) return;

      const nameInput = document.getElementById("art-name");
      const fileInput = document.getElementById("art-file");
      const descInput = document.getElementById("art-desc");

      const artistName = nameInput.value.trim();
      const description = descInput.value.trim();
      const file = fileInput.files && fileInput.files[0];

      if (!artistName || !file) {
        setStatus(status, "Please add your name and choose a file.", "error");
        return;
      }

      const maxBytes = (cfg.MAX_UPLOAD_MB || 5) * 1024 * 1024;
      if (file.size > maxBytes) {
        setStatus(status, `File too large. Max ${cfg.MAX_UPLOAD_MB || 5}MB.`, "error");
        return;
      }

      const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
      if (!allowed.includes(file.type)) {
        setStatus(status, "Unsupported file type. PNG / JPG / WEBP / GIF only.", "error");
        return;
      }

      setStatus(status, "Uploading…", "loading");
      form.querySelector("button[type=submit]").disabled = true;

      try {
        const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `pending/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

        // 1. Upload image to storage bucket
        const up = await sb.storage
          .from(cfg.STORAGE_BUCKET || "fan-art")
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (up.error) throw up.error;

        // 2. Get the public URL
        const { data: pub } = sb.storage
          .from(cfg.STORAGE_BUCKET || "fan-art")
          .getPublicUrl(path);

        // 3. Insert metadata row (pending)
        const ins = await sb.from("fan_art").insert({
          artist_name: artistName,
          image_url: pub.publicUrl,
          storage_path: path,
          description: description || null,
          approved: false
        });

        if (ins.error) throw ins.error;

        setStatus(status, "Submitted! Your art is awaiting review.", "success");
        form.reset();
      } catch (err) {
        console.error(err);
        setStatus(status, "Upload failed. Please try again.", "error");
      } finally {
        form.querySelector("button[type=submit]").disabled = false;
      }
    });
  }

  // --- Comments ---
  function initCommentForm() {
    const form = document.getElementById("comment-form");
    if (!form) return;
    const status = document.getElementById("comment-status");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!sb) return;

      const name = document.getElementById("comment-name").value.trim();
      const msg = document.getElementById("comment-msg").value.trim();

      if (!name || !msg) {
        setStatus(status, "Please add your name and a message.", "error");
        return;
      }

      setStatus(status, "Posting…", "loading");
      form.querySelector("button[type=submit]").disabled = true;

      try {
        const ins = await sb.from("comments").insert({
          author_name: name,
          message: msg,
          approved: false
        });
        if (ins.error) throw ins.error;

        setStatus(status, "Thanks! Your message is awaiting review.", "success");
        form.reset();
      } catch (err) {
        console.error(err);
        setStatus(status, "Could not post comment. Please try again.", "error");
      } finally {
        form.querySelector("button[type=submit]").disabled = false;
      }
    });
  }

  // --- Render approved gallery ---
  async function renderGallery() {
    const gallery = document.getElementById("art-gallery");
    if (!gallery || !sb) return;

    try {
      const { data, error } = await sb
        .from("fan_art")
        .select("artist_name, image_url, description, created_at")
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(60);

      if (error) throw error;
      if (!data || !data.length) return;

      gallery.innerHTML = data.map(item => `
        <a class="art-card" href="${escapeHtml(item.image_url)}" target="_blank" rel="noopener" title="${escapeHtml(item.description || '')}">
          <img src="${escapeHtml(item.image_url)}" alt="Fan art by ${escapeHtml(item.artist_name)}" loading="lazy" />
          <div class="art-card-meta">${escapeHtml(item.artist_name)}</div>
        </a>
      `).join("");
    } catch (err) {
      console.warn("Could not load gallery", err);
    }
  }

  // --- Render approved comments ---
  async function renderComments() {
    const list = document.getElementById("comments-list");
    if (!list || !sb) return;

    try {
      const { data, error } = await sb
        .from("comments")
        .select("author_name, message, created_at")
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(40);

      if (error) throw error;
      if (!data || !data.length) return;

      list.innerHTML = data.map(c => `
        <article class="comment">
          <p class="comment-author">
            ${escapeHtml(c.author_name)}
            <span class="comment-date">· ${formatDate(c.created_at)}</span>
          </p>
          <p class="comment-message">${escapeHtml(c.message)}</p>
        </article>
      `).join("");
    } catch (err) {
      console.warn("Could not load comments", err);
    }
  }

  // --- Boot ---
  if (disableIfNoBackend()) return;
  initFanArtForm();
  initCommentForm();
  renderGallery();
  renderComments();
})();
