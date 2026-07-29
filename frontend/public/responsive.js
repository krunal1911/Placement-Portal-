// ─── Per-Tab Admin Identity (fixes cross-tab session bleed) ───────────────────
// A browser's cookies (and therefore the login session) are shared by EVERY tab.
// If a superadmin is logged in in one tab and a company admin logs in in another
// tab of the same browser, they'd otherwise share one `req.session.admin` on the
// server — so refreshing the first tab could suddenly show the second admin's
// data. To keep each tab's identity independent (and surviving a refresh), each
// tab keeps its own signed token in sessionStorage (which is NOT shared across
// tabs, unlike cookies/localStorage) and sends it on every request.
(function setupPerTabAdminIdentity() {
    const TOKEN_KEY = "portalAuthToken";

    // Pick up a token handed off via ?tk=... (right after login, or carried
    // forward from a previous page by the click-handler below) and store it
    // for this tab only, then strip it from the visible URL.
    try {
        const params = new URLSearchParams(window.location.search);
        const incoming = params.get("tk");
        if (incoming) {
            sessionStorage.setItem(TOKEN_KEY, incoming);
            params.delete("tk");
            const query = params.toString();
            const cleanUrl = window.location.pathname + (query ? "?" + query : "") + window.location.hash;
            window.history.replaceState({}, "", cleanUrl);
        }
    } catch (e) {}

    function getTabToken() {
        try { return sessionStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
    }

    // Attach the token to every same-origin fetch() call automatically, so
    // individual pages don't need to be edited one by one.
    const originalFetch = window.fetch ? window.fetch.bind(window) : null;
    if (originalFetch) {
        window.fetch = function (input, init) {
            const token = getTabToken();
            if (token) {
                let isSameOrigin = true;
                try {
                    const targetUrl = new URL(typeof input === "string" ? input : input.url, window.location.origin);
                    isSameOrigin = targetUrl.origin === window.location.origin;
                } catch (e) {}

                if (isSameOrigin) {
                    init = init || {};
                    const headers = new Headers(init.headers || (typeof input !== "string" && input.headers) || {});
                    if (!headers.has("Authorization")) headers.set("Authorization", "Bearer " + token);
                    init.headers = headers;
                }
            }
            return originalFetch(input, init);
        };
    }

    // A full-page navigation (clicking a link) can't carry a custom header, so
    // carry this tab's token forward as ?tk= on same-origin link clicks. The
    // logout links intentionally drop the token instead, so this tab correctly
    // becomes logged out.
    document.addEventListener("click", function (e) {
        const token = getTabToken();
        if (!token) return;

        const link = e.target && e.target.closest ? e.target.closest("a[href]") : null;
        if (!link) return;

        const href = link.getAttribute("href");
        if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(href)) return;
        if (link.target === "_blank" || link.hasAttribute("download")) return;

        let url;
        try { url = new URL(href, window.location.origin); } catch (err) { return; }
        if (url.origin !== window.location.origin) return;

        if (url.pathname === "/admin-logout" || url.pathname === "/logout") {
            try { sessionStorage.removeItem(TOKEN_KEY); } catch (err) {}
            return;
        }

        url.searchParams.set("tk", token);
        link.setAttribute("href", url.pathname + url.search + url.hash);
    }, true);
})();

// ─── Immediate Theme Application (Prevents White/Dark Flicker) ────────────────
(function applyInitialTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
})();

// ─── Auto Logout on Admin Page Refresh / Reload ───────────────────────────────────
(function handleAdminRefreshLogout() {
    // Disabled reload auto-logout so page refresh reloads data smoothly without destroying active sessions
    return;
})();

// ─── 30-Minute Idle Inactivity Auto-Logout Handler ─────────────────────────────
(function setupIdleTimeout() {
    const path = window.location.pathname;
    if (path === "/" || path === "/index.html" || path === "/login" || path === "/register" || path === "/admin-login") {
        return;
    }

    const IDLE_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
    let idleTimer;

    function resetIdleTimer() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            try { sessionStorage.clear(); } catch(e) {}
            window.location.replace("/logout");
        }, IDLE_LIMIT_MS);
    }

    ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(evt => {
        window.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    resetIdleTimer();
})();

document.addEventListener("DOMContentLoaded", () => {
    const currentTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", currentTheme);

    const path = window.location.pathname;

    // Helper to create Theme Toggle Button
    function createThemeButton() {
        const themeBtn = document.createElement("button");
        themeBtn.setAttribute("aria-label", "Toggle Day / Night Mode");
        themeBtn.title = "Toggle Day / Night Mode";
        themeBtn.className = "theme-toggle-btn";
        themeBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid var(--border, #cbd5e1);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            padding: 6px 14px;
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.25s ease;
            color: var(--text-main, #0f172a);
        `;
        
        function updateIcon() {
            const active = document.documentElement.getAttribute("data-theme");
            themeBtn.innerHTML = active === "dark" ? "☀️ Day" : "🌙 Night";
            themeBtn.style.background = active === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(37, 99, 235, 0.1)";
            themeBtn.style.color = active === "dark" ? "#f8fafc" : "#0f172a";
        }
        updateIcon();

        themeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const activeTheme = document.documentElement.getAttribute("data-theme");
            const newTheme = activeTheme === "dark" ? "light" : "dark";
            
            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);
            updateIcon();

            // Sync any other theme buttons on page
            document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
                btn.innerHTML = newTheme === "dark" ? "☀️ Day" : "🌙 Night";
                btn.style.background = newTheme === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(37, 99, 235, 0.1)";
                btn.style.color = newTheme === "dark" ? "#f8fafc" : "#0f172a";
            });
        });

        return themeBtn;
    }

    const nav = document.querySelector("nav");
    if (nav) {
        let ul = nav.querySelector("ul");
        if (!ul) {
            ul = document.createElement("ul");
            nav.appendChild(ul);
        }

        const themeLi = document.createElement("li");
        themeLi.className = "nav-theme-toggle";
        themeLi.appendChild(createThemeButton());

        // Check view type
        const isLanding = path === "/" || path === "/index.html";
        const isAuthPage = path === "/login" || path === "/register" || path === "/admin-login";
        const isExplicitAdminPage = path.startsWith("/admin") || 
                                    path.startsWith("/students") || 
                                    path.startsWith("/applications") || 
                                    path.startsWith("/proctoring") || 
                                    path.startsWith("/results") || 
                                    path.startsWith("/manage") || 
                                    path.startsWith("/add-") || 
                                    path.startsWith("/import-") || 
                                    path.startsWith("/export-") || 
                                    path.startsWith("/update-");

        function renderAdminNavbar() {
            const logoutLi = document.createElement("li");
            logoutLi.innerHTML = `<a href="/admin-logout" class="nav-logout-btn">Logout 🚪</a>`;

            fetch("/current-admin")
                .then(res => res.ok ? res.json() : Promise.reject())
                .then(admin => {
                    const navItems = [{ name: "Dashboard", url: "/admin-dashboard" }];
                    if (admin.role === "superadmin") navItems.push({ name: "Students", url: "/students" });
                    navItems.push({ name: "Applications", url: "/applications" });
                    navItems.push({ name: "Drives", url: "/placement-drives" });
                    navItems.push({ name: "Add Drive", url: "/add-company" });
                    navItems.push({ name: "Results", url: "/results" });
                    navItems.push({ name: "Questions", url: "/manage-questions" });

                    ul.innerHTML = "";
                    navItems.forEach(item => {
                        const li = document.createElement("li");
                        const a = document.createElement("a");
                        a.href = item.url;
                        a.textContent = item.name;
                        if (path === item.url || (item.url !== "/" && path.startsWith(item.url))) a.className = "active";
                        li.appendChild(a);
                        ul.appendChild(li);
                    });
                    ul.appendChild(themeLi);
                    ul.appendChild(logoutLi);
                })
                .catch(() => {
                    ul.innerHTML = `
                        <li><a href="/admin-dashboard" class="${path === '/admin-dashboard' ? 'active' : ''}">Dashboard</a></li>
                        <li><a href="/applications" class="${path === '/applications' ? 'active' : ''}">Applications</a></li>
                        <li><a href="/placement-drives" class="${path === '/placement-drives' ? 'active' : ''}">Drives</a></li>
                        <li><a href="/add-company" class="${path === '/add-company' ? 'active' : ''}">Add Drive</a></li>
                        <li><a href="/results" class="${path === '/results' ? 'active' : ''}">Results</a></li>
                    `;
                    ul.appendChild(themeLi);
                    ul.appendChild(logoutLi);
                });
        }

        function renderStudentNavbar() {
            const logoutLi = document.createElement("li");
            logoutLi.innerHTML = `<a href="/logout">Logout</a>`;

            ul.innerHTML = `
                <li><a href="/dashboard" ${path === '/dashboard' ? 'class="active"' : ''}>Dashboard</a></li>
                <li><a href="/profile" ${path === '/profile' ? 'class="active"' : ''}>Profile</a></li>
                <li><a href="/placement-drives" ${path === '/placement-drives' ? 'class="active"' : ''}>Companies</a></li>
                <li><a href="/my-applications" ${path === '/my-applications' ? 'class="active"' : ''}>Applications</a></li>
                <li><a href="/leaderboard" ${path === '/leaderboard' ? 'class="active"' : ''}>Leaderboard</a></li>
            `;
            ul.appendChild(themeLi);
            ul.appendChild(logoutLi);
        }

        if (isLanding) {
            ul.appendChild(themeLi);
        } else if (isAuthPage) {
            ul.innerHTML = "";
            ul.appendChild(themeLi);
        } else if (isExplicitAdminPage) {
            renderAdminNavbar();
        } else if (path === "/placement-drives") {
            fetch("/current-admin")
                .then(res => {
                    if (res.ok) renderAdminNavbar();
                    else renderStudentNavbar();
                })
                .catch(() => renderStudentNavbar());
        } else {
            renderStudentNavbar();
        }

        // Mobile Hamburger Setup
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            display: none; position: fixed; top: 0; left: 0;
            width: 100vw; height: 100vh; background: rgba(0,0,0,0.55);
            z-index: 1030; transition: opacity 0.3s;
        `;
        document.body.appendChild(overlay);

        if (!nav.querySelector(".hamburger")) {
            const hamburger = document.createElement("button");
            hamburger.className = "hamburger";
            hamburger.setAttribute("aria-label", "Toggle navigation");
            hamburger.innerHTML = `<span></span><span></span><span></span>`;
            nav.appendChild(hamburger);

            function openMenu() {
                ul.classList.add("open");
                hamburger.classList.add("active");
                overlay.style.display = "block";
                document.body.style.overflow = "hidden";
            }

            function closeMenu() {
                ul.classList.remove("open");
                hamburger.classList.remove("active");
                overlay.style.display = "none";
                document.body.style.overflow = "";
            }

            hamburger.addEventListener("click", (e) => {
                e.stopPropagation();
                ul.classList.contains("open") ? closeMenu() : openMenu();
            });

            overlay.addEventListener("click", closeMenu);
        }
    }
});
