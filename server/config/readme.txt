Remove the .default from all configuration files for the server to read them.
These configuration files are Javascript, so functions can be used if need be.
They export an object (module.exports = {}), set configuration via object properties.
Everything in this folder but .default files are in the .gitignore (will not be tracked by git)
Always move your database credentials out of this folder, you can find the configuration for the directory in database.