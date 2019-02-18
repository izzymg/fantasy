const bcrypt = require("bcrypt");
const db = require("./database/database");
(async() => {
  const adminUsername = process.argv[2];
  const adminPassword = process.argv[3];
  if (!adminUsername || !adminPassword) {
    return console.log("Usage: node.js ./generateAdmin.js [adminUsername] [adminPassword]");
  }
  try {
    const dbInfo = await db.open();
    console.log(`Connected to db on ${dbInfo.host}:${dbInfo.port}`);
    const hash = await bcrypt.hash(adminPassword, 15);
    await db.query("INSERT INTO users SET ?", {
      username: adminUsername,
      password: hash
    });
    console.log(`Created user ${adminUsername}, closing db connection and exiting.`);
    return await db.close();
  } catch (e) {
    console.error("Admin generation failed:", e);
    return await db.close();
  }
})();
