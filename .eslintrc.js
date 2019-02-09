module.exports = {
    env: {
        es6: true,
        node: true,
        browser: true,
    },
    extends: "eslint:recommended",
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module",
    },
    rules: {
        "arrow-body-style": ["error", "as-needed"],
        "quote-props": ["error", "consistent"],
        "indent": ["error", 4, { "SwitchCase": 1 }],
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "double"],
        "semi": ["error", "always"],
        "no-console": "off",
        "max-len": ["error", {"code": 100}]
    },
};
