export type AppLocale = 'uz' | 'ru' | 'en';

export interface TranslationSchema {
  appName: string;
  tabs: {
    home: string;
    calendar: string;
    debts: string;
    reports: string;
    more: string;
  };
  screens: {
    addIncome: string;
    addExpense: string;
    edit: string;
    addDebt: string;
    editDebt: string;
    categories: string;
    search: string;
    dailyReport: string;
    savings: string;
    goal: string;
    budget: string;
    backup: string;
    security: string;
    ai: string;
    notFound: string;
  };
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    back: string;
    loading: string;
    error: string;
    ready: string;
    income: string;
    expense: string;
    debt: string;
    amount: string;
    category: string;
    note: string;
    date: string;
    from: string;
    to: string;
    name: string;
    noData: string;
    confirmDelete: string;
    currency: string;
    all: string;
  };
  dashboard: {
    totalBalance: string;
    monthlyIncome: string;
    monthlyExpense: string;
    aiTip: string;
    savingsGoals: string;
    recentTransactions: string;
  };
  quickActions: {
    income: string;
    expense: string;
    debt: string;
  };
  calendar: {
    income: string;
    expense: string;
    hint: string;
    dailyReport: string;
  };
  debts: {
    borrowed: string;
    lent: string;
    active: string;
    paid: string;
    addDebt: string;
    personName: string;
    dueDate: string;
    optional: string;
    paidAmount: string;
    remaining: string;
    paymentAmount: string;
    pay: string;
    markPaid: string;
    noDebts: string;
    debtNotFound: string;
    history: string;
  };
  reports: {
    reportOf: string;
    netBalance: string;
    byCategory: string;
    dailyExpenses: string;
    statistics: string;
    mostExpensive: string;
    avgDaily: string;
    thousandSuffix: string;
  };
  more: {
    tools: string;
    categoriesDesc: string;
    searchDesc: string;
    savingsDesc: string;
    budgetDesc: string;
    backupDesc: string;
    securityDesc: string;
    aiDesc: string;
    language: string;
    languageDesc: string;
    transactions: string;
    incomes: string;
    expenses: string;
    noIncomes: string;
    noExpenses: string;
    deleteTransaction: string;
  };
  categories: {
    add: string;
    edit: string;
    name: string;
    cannotDelete: string;
    inUse: string;
    confirmDelete: string;
    incomes: string;
    expenses: string;
  };
  transaction: {
    addIncome: string;
    addExpense: string;
    save: string;
    enterAmount: string;
    selectCategory: string;
    notFound: string;
  };
  search: {
    title: string;
    placeholder: string;
    searchBtn: string;
    noResults: string;
    allTypes: string;
  };
  savings: {
    title: string;
    addGoal: string;
    editGoal: string;
    goalName: string;
    targetAmount: string;
    currentAmount: string;
    addMoney: string;
    deadline: string;
    progress: string;
    noGoals: string;
    confirmDelete: string;
  };
  budget: {
    title: string;
    setLimit: string;
    spent: string;
    limit: string;
    overBudget: string;
    noCategories: string;
    editLimit: string;
  };
  backup: {
    title: string;
    export: string;
    exportDesc: string;
    import: string;
    importDesc: string;
    importWarning: string;
    successExport: string;
    successImport: string;
    error: string;
    cancelled: string;
  };
  security: {
    pinSet: string;
    pinNotSet: string;
    setPin: string;
    removePin: string;
    confirmPin: string;
    newPin: string;
    pinMustBe4: string;
    pinMismatch: string;
    pinSetSuccess: string;
    pinRemoveConfirm: string;
    biometric: string;
    biometricDesc: string;
    notifications: string;
    notificationsDesc: string;
    enterPinToContinue: string;
    wrongPin: string;
    unlock: string;
  };
  ai: {
    title: string;
    offlineMode: string;
    openAiConnected: string;
    apiKey: string;
    apiKeyHint: string;
    placeholder: string;
    preparing: string;
    quickQuestions: string[];
    error: string;
  };
  notFound: {
    title: string;
    description: string;
    goHome: string;
  };
  months: string[];
  monthsShort: string[];
  calendarLocale: {
    dayNames: string[];
    dayNamesShort: string[];
    today: string;
  };
  languages: {
    uz: string;
    ru: string;
    en: string;
  };
}

export type TranslationKey = keyof TranslationSchema;
