module.exports = (req, res, next) => {
  // contoh: auto-timestamp untuk POST/PUT/PATCH
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    req.body.updatedAt = new Date().toISOString();
    if (req.method === "POST" && !req.body.createdAt) {
      req.body.createdAt = new Date().toISOString();
    }
  }

  // contoh: pseudo proteksi endpoint tertentu
  if (req.path.startsWith("/alerts") && req.method === "POST") {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return res.status(401).jsonp({ error: "Unauthorized: Bearer token required" });
    }
  }

  next();
};
