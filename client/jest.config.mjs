export default {
  preset: "ts-jest",
  testEnvironment: "jsdom", // To test React components
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest", // Використовуємо babel для трансформації tsx
  },
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],
};
