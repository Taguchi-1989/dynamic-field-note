import React from 'react';

const ElectronModeIndicator: React.FC = () => {
  // 開発時は単純な表示のみ
  const isElectron = typeof window !== 'undefined' && 
                    typeof (window as any).electronAPI !== 'undefined';
  
  if (!isElectron) return null;
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: '#2563eb', 
      color: 'white', 
      padding: '4px 8px', 
      borderRadius: '4px', 
      fontSize: '12px',
      zIndex: 1000
    }}>
      Electron Mode
    </div>
  );
};

export default ElectronModeIndicator;