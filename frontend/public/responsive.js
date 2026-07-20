document.addEventListener("DOMContentLoaded", () => {
    // ─── Theme Initialization ───────────────────────────────────────────
    const currentTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", currentTheme);

    const nav = document.querySelector("nav");
    if (!nav) return;

    // ─── Reusable Dynamic Nav Menu Builder ─────────────────────────────
    let ul = nav.querySelector("ul");
    if (!ul) {
        ul = document.createElement("ul");
        nav.appendChild(ul);
    }
    ul.innerHTML = ""; // Clear statically defined nav list

    const path = window.location.pathname;
    
    // Detect Admin view path matching
    const isAdminView = path.startsWith("/admin") || 
                        path.startsWith("/students") || 
                        path.startsWith("/applications") || 
                        path.startsWith("/proctoring") || 
                        path.startsWith("/manage") || 
                        path.startsWith("/add-") || 
                        path.startsWith("/import-") || 
                        path.startsWith("/update-");

    const navItems = [];
    if (isAdminView) {
        navItems.push({ name: "Dashboard", url: "/admin-dashboard" });
        navItems.push({ name: "Students", url: "/students" });
        navItems.push({ name: "Applications", url: "/applications" });
        navItems.push({ name: "Proctoring", url: "/proctoring" });
    } else {
        navItems.push({ name: "Dashboard", url: "/dashboard" });
        navItems.push({ name: "Profile", url: "/profile" });
        navItems.push({ name: "Leaderboard", url: "/leaderboard" });
    }

    // Build the list items dynamically
    navItems.forEach(item => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = item.url;
        a.textContent = item.name;
        // Dynamically compute the active state
        if (path === item.url || (item.url !== "/" && path.startsWith(item.url))) {
            a.className = "active";
        }
        li.appendChild(a);
        ul.appendChild(li);
    });

    // Theme Switcher Item
    const themeLi = document.createElement("li");
    themeLi.className = "nav-theme-toggle";
    
    const themeBtn = document.createElement("button");
    themeBtn.setAttribute("aria-label", "Toggle dark theme");
    themeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.3s, transform 0.2s;
    `;
    themeBtn.innerHTML = currentTheme === "dark" ? "☀️" : "🌙";
    
    themeBtn.addEventListener("click", () => {
        const activeTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = activeTheme === "dark" ? "light" : "dark";
        
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        themeBtn.innerHTML = newTheme === "dark" ? "☀️" : "🌙";
        
        themeBtn.style.transform = "scale(1.2)";
        setTimeout(() => themeBtn.style.transform = "scale(1)", 150);
    });

    themeBtn.addEventListener("mouseenter", () => {
        themeBtn.style.background = "var(--primary-light)";
    });
    themeBtn.addEventListener("mouseleave", () => {
        themeBtn.style.background = "none";
    });

    themeLi.appendChild(themeBtn);
    ul.appendChild(themeLi);

    // Logout Item
    const logoutLi = document.createElement("li");
    const logoutA = document.createElement("a");
    logoutA.href = "/logout";
    logoutA.textContent = "Logout";
    logoutLi.appendChild(logoutA);
    ul.appendChild(logoutLi);

    // ─── Mobile Overlay & Hamburger Setup ─────────────────────────────────
    const overlay = document.createElement("div");
    overlay.style.cssText = `
        display: none;
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.55);
        z-index: 1030;
        transition: opacity 0.3s;
    `;
    document.body.appendChild(overlay);

    const hamburger = document.createElement("button");
    hamburger.className = "hamburger";
    hamburger.setAttribute("aria-label", "Toggle navigation");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.innerHTML = `<span></span><span></span><span></span>`;
    nav.appendChild(hamburger);

    function openMenu() {
        ul.classList.add("open");
        hamburger.classList.add("active");
        hamburger.setAttribute("aria-expanded", "true");
        overlay.style.display = "block";
        document.body.style.overflow = "hidden";
    }

    function closeMenu() {
        ul.classList.remove("open");
        hamburger.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
        overlay.style.display = "none";
        document.body.style.overflow = "";
    }

    hamburger.addEventListener("click", (e) => {
        e.stopPropagation();
        ul.classList.contains("open") ? closeMenu() : openMenu();
    });

    overlay.addEventListener("click", closeMenu);

    ul.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 768) closeMenu();
        });
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) closeMenu();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMenu();
    });
});
