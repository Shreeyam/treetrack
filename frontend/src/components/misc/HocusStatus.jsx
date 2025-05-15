import React, { useState, useEffect, useRef } from 'react';

const COLORS = {
  connected: '#28a745',    // green
  disconnected: '#dc3545', // red
};

export default function HocusStatus({ yjsHandler }) {
  const [isConnected, setIsConnected] = useState(true);
  const lastMessageTimestampRef = useRef(Date.now());

  useEffect(() => {
    if (!yjsHandler || !yjsHandler.provider) return;

    // Set up listener for messages from the server
    const handleMessage = () => {
      lastMessageTimestampRef.current = Date.now();
      setIsConnected(true);
    };

    // Check connection status every 5 seconds
    const checkConnectionInterval = setInterval(() => {
      const now = Date.now();
      const elapsedTimeSinceLastMessage = now - lastMessageTimestampRef.current;
      
      // If no message received in the last 20 seconds, consider disconnected
      if (elapsedTimeSinceLastMessage > 20000) {
        setIsConnected(false);
      }
    }, 5000);

    // Add event listener to provider
    const provider = yjsHandler.provider;
    provider.on('message', handleMessage);

    // Clean up
    return () => {
      clearInterval(checkConnectionInterval);
      provider.off('message', handleMessage);
    };
  }, [yjsHandler]);

  return (
    <div
      title={isConnected ? "Connected to project server" : "Disconnected from project server"}
      style={{
        position: 'fixed',
        bottom: '20px',
        left:  '52px',
        width:  '14px',
        height: '14px',
        borderRadius: '50%',
        border: '1px solid #666',
        background: isConnected ? COLORS.connected : COLORS.disconnected,
        cursor: 'pointer',
        zIndex: 1000,
      }}
    />
  );
}