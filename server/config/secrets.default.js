module.exports = {
  // Example mysql://user:pass@host/db?debug=true&charset=BIG5_CHINESE_CI&timezone=-0700
  db_url: process.env.DB_URL || "mysql://root:password@localhost/fantasy",
  //[redis[s]:]//[[user][:password@]][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]]
  redis_url: process.env.REDIS_URL || "redis://localhost:6379",
};