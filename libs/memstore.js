// 1-1 fill in for redis
exports.createClient = () => {
  let client = {};
  console.warn(
    `WARNING: Server is configured to use memory instead of Redis.
        This is not safe for production environments and is intended for development only.`
  );
  return {
    open,
    close: () => client = null,
    del: (key) => {
      if(client[key]) {
        client[key] = null;
        return 1;
      }
      return 0;
    },
    hDel: (key, field) => {
      if(client[key][field]) {
        client[key][field] = null;
        return 1;
      }
      return 0;
    },
    hGet: (key, field) => client[key] ? client[key][field] : null,
    hSet: (key, field, val) => {
      if(client[key]) {
        client[key][field] = val;
      } else {
        client[key] = {};
        client[key][field] = val;
      }
    },
    expire: (key, seconds) => setTimeout(() => client[key] = null, seconds * 1000)
  };
};