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
        "arrow-body-style": ["warn", "as-needed"],
        "arrow-parens": ["warn", "always"],
        "space-before-function-paren": ["warn", "never"],
        "quote-props": ["error", "consistent"],
        "indent": ["error", 2, { "SwitchCase": 1 }],
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "double"],
        "semi": ["error", "always"],
        "no-console": "off",
        "max-len": ["error", {"code": 100}],
        "no-unused-vars": ["warn"]
    },
};
