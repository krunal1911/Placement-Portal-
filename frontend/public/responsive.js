document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector("nav");
    if (!nav) return;

    const ul = nav.querySelector("ul");
    if (!ul) return;

    // Create overlay for mobile nav
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

    // Create hamburger button
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

    // Close menu when a nav link is clicked
    ul.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 768) closeMenu();
        });
    });

    // Close menu on resize to desktop
    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) closeMenu();
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMenu();
    });
});
