import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig([{
    languageOptions: {
        globals: {
            ...globals.jasmine,
        },
    },

    rules: {
        "func-names": ["off"],
        "prefer-arrow-callback": ["off"],
    },
}]);