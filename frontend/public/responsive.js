// ─── Immediate Theme Application (Prevents White/Dark Flicker) ────────────────
(function applyInitialTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
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
        const isAdminView = path.startsWith("/admin") || 
                            path.startsWith("/students") || 
                            path.startsWith("/applications") || 
                            path.startsWith("/proctoring") || 
                            path.startsWith("/results") || 
                            path.startsWith("/manage") || 
                            path.startsWith("/add-") || 
                            path.startsWith("/import-") || 
                            path.startsWith("/export-") || 
                            path.startsWith("/update-");

        if (isLanding) {
            // Landing page: Keep landing navigation and append theme toggle button
            ul.appendChild(themeLi);
        } else if (isAuthPage) {
            // Auth pages: Append theme toggle button to top bar
            ul.innerHTML = "";
            ul.appendChild(themeLi);
        } else if (isAdminView) {
            // Admin pages
            const logoutLi = document.createElement("li");
            logoutLi.innerHTML = `<a href="/logout">Logout</a>`;

            fetch("/current-admin")
                .then(res => res.ok ? res.json() : Promise.reject())
                .then(admin => {
                    const navItems = [{ name: "Dashboard", url: "/admin-dashboard" }];
                    if (admin.role === "superadmin") navItems.push({ name: "Students", url: "/students" });
                    navItems.push({ name: "Applications", url: "/applications" });
                    navItems.push({ name: "Results", url: "/results" });
                    navItems.push({ name: "Questions", url: "/manage-questions" });
                    navItems.push({ name: "Proctoring", url: "/proctoring" });

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
                        <li><a href="/admin-dashboard">Dashboard</a></li>
                        <li><a href="/applications">Applications</a></li>
                        <li><a href="/results">Results</a></li>
                        <li><a href="/proctoring">Proctoring</a></li>
                    `;
                    ul.appendChild(themeLi);
                    ul.appendChild(logoutLi);
                });
        } else {
            // Student pages
            const logoutLi = document.createElement("li");
            logoutLi.innerHTML = `<a href="/logout">Logout</a>`;

            ul.innerHTML = `
                <li><a href="/dashboard" ${path === '/dashboard' ? 'class="active"' : ''}>Dashboard</a></li>
                <li><a href="/profile" ${path === '/profile' ? 'class="active"' : ''}>Profile</a></li>
                <li><a href="/leaderboard" ${path === '/leaderboard' ? 'class="active"' : ''}>Leaderboard</a></li>
            `;
            ul.appendChild(themeLi);
            ul.appendChild(logoutLi);
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
