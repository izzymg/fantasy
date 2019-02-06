exports.lengthCheck = (str, max, name) => {
    if (!str) {
        return null;
    }
    if (typeof str !== "string") {
        return `${name}: expected string.`;
    }
    if (str.length > max) {
        return `${name} must be under ${max} characters.`;
    }
    return null;
};


exports.trimEscapeHtml = function (str) {
    if (!str) { return null; }
    str = str.trim();
    if (!str) { return null; }
    return str
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/`/g, "&#96;")
        .replace(/\r\n/g, "\n")
        .replace(/\n{2,}/g, "\n\n")
        .replace(/\n/g, "<br>")
        .replace(/(<br>){2,}/g, "<br><br>");
};