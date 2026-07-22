import { defineConfig, globalIgnores } from "eslint/config";
import babel from "@babel/eslint-plugin";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores([
    "dist/**/*",
    "docs/**/*",
    "node_modules/**/*",
    "test/functional/example/**/*",
]), {
    ...compat.extends("devextreme/javascript"),

    plugins: {
        "@babel": babel,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.commonjs,
        },

        ecmaVersion: 2020,
        sourceType: "script",
    },

    settings: {
        "import/resolver": {
            webpack: {
                config: "_develop/webpack.config.js",
            },
        },
    },

    rules: {
        "prefer-arrow-callback": "warn",
        "arrow-body-style": "off",
        "class-methods-use-this": "off",

        "import/no-extraneous-dependencies": ["error", {
            devDependencies: ["_develop/*.js", "test/**/*.js"],
        }],

        "no-param-reassign": "off",

        "no-use-before-define": ["error", {
            functions: false,
        }],

        "import/named": "error",
        "max-classes-per-file": "off",
    },
}]);
