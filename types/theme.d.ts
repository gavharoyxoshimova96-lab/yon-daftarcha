import type {} from 'react-native-paper';

declare module 'react-native-paper/lib/typescript/types' {
  interface MD3Colors {
    income: string;
    expense: string;
  }
}

declare module 'react-native-paper/src/types' {
  interface MD3Colors {
    income: string;
    expense: string;
  }
}
