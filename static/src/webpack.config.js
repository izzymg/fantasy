const path = require("path");

module.exports = {
  entry: {
    postForm: path.join(__dirname, "ts/postForm.ts"),
    statusbox: path.join(__dirname, "ts/statusbox.ts"),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
      }
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  output: {
    path: path.join(__dirname, "../dist/js")
  }
};
