const bcrypt = require("bcrypt");
(async() => {
  const hash = await bcrypt.hash("modpw", 15);
  return console.log(hash);
})();