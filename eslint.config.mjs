import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "node_modules/**"],
  },
  {
    rules: {
      // eslint-plugin-react-hooks@7's recommended config added React
      // Compiler-oriented rules. This project doesn't use React Compiler,
      // and this rule flags the standard fetch-on-mount pattern
      // (`useEffect(() => { fetchThing() }, [...])`) used throughout the
      // app - not an actual bug here.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
