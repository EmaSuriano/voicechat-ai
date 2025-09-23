import * as React from 'react';
import './index.css';
import ChatInterface from './components/ChatInterface';

function App() {
  return (
    <div className="App min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <ChatInterface />
    </div>
  );
}

export default App;
