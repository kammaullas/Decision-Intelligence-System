import { create } from 'zustand';

export const useStore = create((set) => ({
  // App state
  token: localStorage.getItem('dia_token') || null,
  mode: localStorage.getItem('dia_mode') || 'live', // 'live' or 'demo'
  currentStep: 0, // 0: Login, 1: Define, 2: Options, 3: Criteria, 4: Results
  loading: false,
  loadingText: '',
  globalError: null,
  theme: localStorage.getItem('dia_theme') || 'dark',

  // Scenario state
  title: '',
  desc: '',
  industry: '',
  horizon: '',
  stake: 'High',
  options: [],
  evaluationStyle: 'Balanced',
  criteria: {
    "Strategic Fit": 25,
    "Financial Impact": 20,
    "Risk": 20,
    "Feasibility": 15,
    "Time to Impact": 10,
    "Stakeholder Impact": 10
  },
  result: null,
  extractedData: null,
  framingAnalysis: null,
  decisionHistory: [],
  orgMetrics: null,
  orgInsights: null,

  // Actions
  setToken: (token, mode = 'live') => {
    if (token) {
      localStorage.setItem('dia_token', token);
      localStorage.setItem('dia_mode', mode);
    } else {
      localStorage.removeItem('dia_token');
      localStorage.removeItem('dia_mode');
    }
    set({ token, mode, currentStep: token ? 1 : 0, result: null });
  },
  setStep: (step) => set({ currentStep: step }),
  setLoading: (loading, text = 'Working...') => set({ loading, loadingText: text }),
  setError: (error) => {
    set({ globalError: error });
    if (error) {
      setTimeout(() => set({ globalError: null }), 5000);
    }
  },

  setField: (field, value) => set({ [field]: value }),
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('dia_theme', newTheme);
    return { theme: newTheme };
  }),
  setEvaluationStyle: (style) => set((state) => {
    let newCriteria = { ...state.criteria };
    if (style === 'Balanced') {
      newCriteria = { "Strategic Fit": 25, "Financial Impact": 20, "Risk": 20, "Feasibility": 15, "Time to Impact": 10, "Stakeholder Impact": 10 };
    } else if (style === 'Growth Focused') {
      newCriteria = { "Strategic Fit": 35, "Financial Impact": 25, "Risk": 10, "Feasibility": 10, "Time to Impact": 10, "Stakeholder Impact": 10 };
    } else if (style === 'Risk Averse') {
      newCriteria = { "Strategic Fit": 15, "Financial Impact": 20, "Risk": 35, "Feasibility": 10, "Time to Impact": 10, "Stakeholder Impact": 10 };
    } else if (style === 'Fast Expansion') {
      newCriteria = { "Strategic Fit": 20, "Financial Impact": 20, "Risk": 15, "Feasibility": 10, "Time to Impact": 25, "Stakeholder Impact": 10 };
    }
    return { evaluationStyle: style, criteria: newCriteria };
  }),
  setCriteriaWeight: (criterion, weight) => set((state) => {
    let newWeight = Math.min(100, Math.max(0, weight));
    const oldWeight = state.criteria[criterion];
    let diff = newWeight - oldWeight;
    if (diff === 0) return {};

    const newCriteria = { ...state.criteria };
    newCriteria[criterion] = newWeight;
    
    let otherKeys = Object.keys(newCriteria).filter(k => k !== criterion);
    let otherTotal = 100 - oldWeight;

    if (otherTotal === 0) {
      let remaining = 100 - newWeight;
      const base = Math.floor(remaining / otherKeys.length);
      let remainder = remaining % otherKeys.length;
      for (let k of otherKeys) {
        newCriteria[k] = base + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
      }
    } else {
      let remainingToDistribute = -diff;
      let amounts = {};
      for (let k of otherKeys) {
        amounts[k] = newCriteria[k] + remainingToDistribute * (newCriteria[k] / otherTotal);
      }
      
      let totalDistributed = 0;
      let remainders = [];
      for (let k of otherKeys) {
        const floored = Math.floor(amounts[k]);
        newCriteria[k] = floored;
        totalDistributed += floored;
        remainders.push({ k, rem: amounts[k] - floored });
      }
      
      let toAdd = (100 - newWeight) - totalDistributed;
      remainders.sort((a, b) => b.rem - a.rem);
      for (let i = 0; i < toAdd; i++) {
        newCriteria[remainders[i].k]++;
      }
    }

    return { criteria: newCriteria, evaluationStyle: 'Custom' };
  }),
  setOptions: (options) => set({ options }),
  setResult: (result) => set({ result }),
  setExtractedData: (data) => set({ extractedData: data }),
  setFramingAnalysis: (data) => set({ framingAnalysis: data }),
  setOrgMetrics: (data) => set({ orgMetrics: data }),
  setOrgInsights: (data) => set({ orgInsights: data }),
  
  fetchHistory: async () => {
    const { token } = useStore.getState();
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/decisions', {
        headers: { 'X-Auth-Token': token }
      });
      const data = await res.json();
      if (!data.error) set({ decisionHistory: data });
    } catch (e) {
      console.error(e);
    }
  },
  
  resetApp: () => set({
    title: '',
    desc: '',
    industry: '',
    horizon: '',
    stake: 'High',
    options: [],
    result: null,
    extractedData: null,
    framingAnalysis: null,
    currentStep: 1
  }),

  logout: () => {
    localStorage.removeItem('dia_token');
    localStorage.removeItem('dia_mode');
    set({
      token: null,
      mode: 'live',
      currentStep: 0,
      title: '',
      desc: '',
      industry: '',
      horizon: '',
      options: [],
      result: null,
      extractedData: null,
      framingAnalysis: null
    });
  }
}));
