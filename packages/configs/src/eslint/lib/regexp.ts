import regexpPlugin from "eslint-plugin-regexp";

const preset = regexpPlugin.configs["flat/recommended"];

// `flat/recommended` leaves it off, and it is the shape behind every quadratic regex Sonar reported
const regexp: object = {
    ...preset,
    rules: { ...preset.rules, "regexp/no-super-linear-move": "error" },
};

export default regexp;
