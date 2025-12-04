import { useState } from 'react';

export default function UsernameScreen({ onComplete }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const raw = (formData.get('username') || '').toString().trim();

    if (!raw || raw.length < 3) {
      alert('Please choose a name with at least 3 characters.');
      return;
    }

    onComplete(raw);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f3f0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2.5rem 2rem',
        fontFamily: "'Fustat', 'Inter', -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '999px',
            backgroundColor: '#f3f4f6',
            minWidth: '220px',
          }}
        >
          <input
            id="username"
            name="username"
            type="text"
            placeholder="username"
            autoComplete="off"
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.95rem',
              color: '#4b5563',
              textAlign: 'center',
            }}
          />
        </div>

        <button
          type="submit"
          aria-label="Continue"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '999px',
            border: 'none',
            background:
              'radial-gradient(circle at 30% 20%, #10b981, #059669)',
            boxShadow: '0 8px 20px rgba(5,150,105,0.3)',
            cursor: 'pointer',
          }}
        />
      </form>
    </div>
  );
}

