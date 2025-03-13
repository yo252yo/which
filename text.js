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
}