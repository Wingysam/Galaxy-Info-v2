declare global {
  namespace NodeJS { // eslint-disable-line
      interface ProcessEnv { // eslint-disable-line
        name: string;
      }
  }
}

export {}
