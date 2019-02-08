module.exports = {
    env: {
        es6: true,
        node: true,
        browser: true,
    },
    extends: ["eslint:recommended", "prettier"],
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module",
    },
    rules: {
        "linebreak-style": ["error", "unix"],
        "no-console": "off",
    },
};
