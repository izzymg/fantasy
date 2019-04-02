// 1-1 fill in for redis
exports.createClient = () => {
  let client = {};
  return {
    open: () => client = { },
    close: () => client = null,
    del: (key) => {
      if(client[key]) {
        delete client[key];
        return 1;
      }
      return 0;
    },
    hDel: (key, field) => {
      if(client[key] && client[key][field]) {
        delete client[key][field];
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