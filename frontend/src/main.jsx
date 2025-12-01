import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('🚀 TogetherStream: Starting app...');

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f0f0; font-family: sans-serif;">
      <div>
        <h1>Error: Root element not found</h1>
        <p>Make sure index.html has a &lt;div id="root"&gt;&lt;/div&gt; element</p>
      </div>
    </div>
  `;
} else {
  console.log('✅ Root element found');
  
  try {
    console.log('📦 Creating React root...');
    const root = ReactDOM.createRoot(rootElement);
    
    console.log('🎨 Rendering App component...');
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('✅ App rendered successfully!');
  } catch (error) {
    console.error('❌ Failed to render app:', error);
    rootElement.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: sans-serif; padding: 2rem;">
        <div style="text-align: center;">
          <h1>Error Loading App</h1>
          <p style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
            ${error.message}
          </p>
          <p>Check the browser console (F12) for more details.</p>
          <button 
            onclick="location.reload()" 
            style="padding: 0.75rem 1.5rem; background: #FF6B9D; color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 1rem; font-size: 1rem;"
          >
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
}
