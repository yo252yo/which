const LAST_PAGE = 34;

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

let lang = getQueryParam("lang") || "en";
if (!(["fr", "en"].includes(lang))) {
    lang = "en";
}

var elements = document.getElementsByClassName(lang);
for (var e of elements) {
    e.style.visibility = "visible";
}


const go = function (page) {
    window.location = page + ".html" + window.location.search;
}

document.addEventListener("DOMContentLoaded", function () {
    const match = window.location.pathname.match(/(\d+)\.html$/);
    if (match) {
        const n = parseInt(match[1], 10);
        const navDiv = document.createElement("div");
        navDiv.id = "navigation";

        let destination = n > 1 ? (n - 1) : "title";
        if (destination == "title" && localStorage.getItem("finished")) {
            destination = LAST_PAGE;
        }

        navDiv.innerHTML = `
            <a href="${destination}.html" style="text-decoration: none;" title="back">⏪</a>
            ${n} / ${LAST_PAGE}
            <a href="#" onclick="location.reload();" style="text-decoration: none;" title="reload">🔄</a>
            <a href="title.html" style="text-decoration: none;" title="home">🏠</a>
        `;

        document.body.appendChild(navDiv);

        // const maxPage = localStorage.getItem("maxPage");
        // localStorage.setItem("maxPage", Math.max(maxPage, n));
        localStorage.setItem("maxPage", n);


        if (localStorage.getItem("finished")) {
            const ngpDiv = document.createElement("div");
            ngpDiv.id = "newgameplus";
            var color = localStorage.getItem("forcedColor") || window.PLAYER_COLOR || "#444444"
            var extraClass = localStorage.getItem("forcedColor") ? "lockedColor" : "";
            ngpDiv.innerHTML = `
            <input type="color" id="colorPicker" value="${color}" class="${extraClass}" style="width:30px;height:30px;padding:0px;">
            &nbsp;
            <a onClick="window.resetColor();">🧹</a>
        `;
            document.body.appendChild(ngpDiv);

            const colorPicker = document.getElementById('colorPicker');

            // Add an event listener to detect color changes
            colorPicker.addEventListener('input', function () {
                const selectedColor = this.value;
                localStorage.setItem("forcedColor", selectedColor);
                window.checkColor();
                this.classList.add("lockedColor");
            });
        }
    }
});
