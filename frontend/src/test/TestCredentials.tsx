import React, { useEffect } from 'react';
// import { credentialsService } from '../services/CredentialsService';

export const TestCredentials: React.FC = () => {
  /*
  useEffect(() => {
    // Test save
    console.log('[Test] Saving OpenAI credentials...');
    credentialsService.saveProvider({
      provider: 'openai',
      apiKey: 'sk-test-123',
      model: 'gpt-4',
      enabled: true,
    });
    
    // Test load
    console.log('[Test] Loading active provider...');
    const active = credentialsService.getActiveProvider();
    console.log('[Test] Active provider:', active);
    
    // Test list
    console.log('[Test] All providers:', credentialsService.getProviders());
    
    // Test hasProviders
    console.log('[Test] Has providers:', credentialsService.hasProviders());
  }, []);*/
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>Credentials Service Test</h2>
      <p>Currently disabled</p>
      {/*
      <p>Check console for results!</p>
      <button onClick={() => {
        const active = credentialsService.getActiveProvider();
        alert(`Active: ${active?.provider} - ${active?.apiKey}`);
      }}>
        Show Active Provider
      </button>
      */}
    </div>
  );
};