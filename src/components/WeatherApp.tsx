"use client";

export function WeatherApp() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'red', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontSize: '2rem',
      color: 'white'
    }}>
      <div>
        <h1>WEATHER APP IS WORKING!</h1>
        <p>If you can see this, the component is rendering.</p>
        <button onClick={() => alert('Button clicked!')}>Test Button</button>
      </div>
    </div>
  );
}