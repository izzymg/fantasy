const Joi = require("joi");
const config = require("../../config/config");

const schema = Joi.object().keys({
  name: Joi.string().default(config.posts.defaultName || "Anonymous"),
});

module.exports = schema;