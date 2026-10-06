module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
   modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
