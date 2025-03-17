const TOTAL_PAGES = 13;

document.addEventListener("DOMContentLoaded", function () {
    const params = window.location.search; // Get current URL query parameters
    if (params) {
        document.querySelectorAll("a").forEach(link => {
            if (link.href.includes("?")) {
                link.href += "&" + params.substring(1); // Append params if URL already has query
            } else {
                link.href += params; // Otherwise, add params
            }
        });
    }
});

function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

const lang = getQueryParam("lang") || "en";

document.querySelectorAll(".fr, .en").forEach(el => {
    if (!el.classList.contains(lang)) {
        el.classList.add("hidden");
    }
});

const go = function (page) {
    window.location = page + ".html" + window.location.search;
    localStorage.setItem("locationSearch", window.location.search);
}

document.addEventListener("DOMContentLoaded", function () {
    const match = window.location.pathname.match(/(\d+)\.html$/);
    if (match) {
        const n = parseInt(match[1], 10);
        const navDiv = document.createElement("div");
        navDiv.id = "navigation";

        const destination = n ? (n - 1) : "title";

        navDiv.innerHTML = `
            <a href="${destination}.html" style="text-decoration: none;" title="back">⏪</a>
            ${n + 1} / ${TOTAL_PAGES + 1}
            <a href="title.html" style="text-decoration: none;" title="home">🏠</a>
        `;

        document.body.appendChild(navDiv);

        const maxPage = localStorage.getItem("maxPage");
        localStorage.setItem("maxPage", Math.max(maxPage, n));
    }
});
