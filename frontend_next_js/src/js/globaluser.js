import React, { createContext, useContext, useState } from 'react';

// Create a context for the global state
const GlobalStateContext = createContext(null);

// Create a provider component for the global state
export const GlobalStateProvider = ({ children }) => {
  // Define the global state and the updater function
  const [user, setUser] = useState(null);
  const [authMethod, setAuthMethod] = useState('credentials');

  return (
    <GlobalStateContext.Provider value={{ user, setUser, authMethod, setAuthMethod }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

// Hook to access and update the global state
export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};
