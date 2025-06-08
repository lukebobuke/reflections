// Example: Simple DOMContentLoaded event
document.addEventListener("DOMContentLoaded", () => {
    console.log("Frontend JS loaded.");

    const menuBtn = document.getElementById("menuBtn");
    const navPopup = document.getElementById("navPopup");
    if (menuBtn && navPopup) {
        menuBtn.addEventListener("click", () => {
            navPopup.classList.toggle("active");
        });
        document.addEventListener("click", (e) => {
            if (!navPopup.contains(e.target) && e.target !== menuBtn) {
                navPopup.classList.remove("active");
            }
        });
    }
});
