import React from 'react';

interface FallbackMonitorProps {
  children?: React.ReactNode;
}

const FallbackMonitor: React.FC<FallbackMonitorProps> = ({ children }) => <>{children ?? null}</>;

export default FallbackMonitor;
