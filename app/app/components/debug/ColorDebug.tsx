'use client';

import { useEffect } from 'react';

export function ColorDebug() {
  useEffect(() => {
    // Log style loading status
    console.log('🎨 Color Debug Component Mounted');
    
    // Check if CSS variables are loaded
    const root = document.documentElement;
    const computedStyles = getComputedStyle(root);
    
    const cssVars = {
      primary: computedStyles.getPropertyValue('--primary'),
      secondary: computedStyles.getPropertyValue('--secondary'),
      accent: computedStyles.getPropertyValue('--accent'),
      background: computedStyles.getPropertyValue('--background'),
      foreground: computedStyles.getPropertyValue('--foreground')
    };
    
    console.log('🎨 CSS Variables Loaded:', cssVars);
    
    // Check if dark mode is active
    const isDarkMode = document.documentElement.classList.contains('dark');
    console.log('🌓 Dark Mode Active:', isDarkMode);
    
    // Check for gradient support
    const testEl = document.createElement('div');
    testEl.style.background = 'linear-gradient(red, blue)';
    const hasGradientSupport = testEl.style.background.includes('gradient');
    console.log('🌈 Gradient Support:', hasGradientSupport);
    
    // Log any CSS loading errors
    const styleSheets = Array.from(document.styleSheets);
    styleSheets.forEach((sheet, index) => {
      try {
        const rules = sheet.cssRules || sheet.rules;
        console.log(`✅ Stylesheet ${index} loaded:`, sheet.href || 'inline', `(${rules.length} rules)`);
      } catch (e) {
        console.error(`❌ Stylesheet ${index} failed:`, sheet.href || 'inline', e);
      }
    });
    
  }, []);

  return (
    <>
      {/* Gradient indicator */}
      <div className="color-debug-indicator" />
      
      {/* Color palette grid */}
      <div className="debug-style-check">
        <div title="Primary" />
        <div title="Secondary" />
        <div title="Accent" />
        <div title="Destructive" />
      </div>
      
      {/* Additional inline debug */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          padding: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          fontSize: '12px',
          fontFamily: 'monospace',
          borderRadius: '5px',
          zIndex: 9999
        }}
      >
        <div>Debug: Check console for color info</div>
        <div>Theme: Check console logs</div>
      </div>
    </>
  );
}