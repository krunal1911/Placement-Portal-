document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector("nav");
    if (!nav) return;

    const ul = nav.querySelector("ul");
    if (!ul) return;

    // Create hamburger element
    const hamburger = document.createElement("button");
    hamburger.className = "hamburger";
    hamburger.setAttribute("aria-label", "Toggle navigation");
    hamburger.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;

    // Insert hamburger into navbar
    nav.appendChild(hamburger);

    // Toggle navigation when hamburger is clicked
    hamburger.addEventListener("click", (e) => {
        e.stopPropagation();
        ul.classList.toggle("open");
        hamburger.classList.toggle("active");
    });

    // Close navigation when clicking outside
    document.addEventListener("click", (e) => {
        if (!nav.contains(e.target)) {
            ul.classList.remove("open");
            hamburger.classList.remove("active");
        }
    });
});
