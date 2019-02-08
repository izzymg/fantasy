const signatures = {
    "89504E470D0A1A0A": "image/png",
    // There are two potential accepted gif types
    "474946383761": "image/gif",
    "474946383961": "image/gif",
    FFD8: "image/jpeg",
};

exports.extensions = {
    "image/png": "png",
    "image/gif": "gif",
    "image/jpeg": "jpg",
};

exports.getAcceptedMimetype = function(buffer) {
    // First 10 bytes of buffer in hex
    const bufferHex = buffer.toString("hex");
    for (let signature in signatures) {
        // Check signature against first bytes
        if (signature === bufferHex.slice(0, signature.length).toUpperCase()) {
            const mimetype = signatures[signature];
            return mimetype;
        }
    }
    return null;
};
