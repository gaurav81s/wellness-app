import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function App() {
  // State to store form data
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState('');
  const [weightEntries, setWeightEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load existing weight entries when component starts
  useEffect(() => {
    fetchWeightEntries();
  }, []);

  // Function to get weight entries from database
  const fetchWeightEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', '550e8400-e29b-41d4-a716-446655440000') // Only show entries for our test user
        .order('date_recorded', { ascending: false });

      if (error) {
        console.error('Error fetching entries:', error);
      } else {
        setWeightEntries(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Function to save new weight entry
  const saveWeightEntry = async (e) => {
    e.preventDefault();
    
    if (!weight || !date) {
      setMessage('Please fill in both weight and date');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .insert([
          {
            user_id: '550e8400-e29b-41d4-a716-446655440000', // Proper UUID format for testing
            weight: parseFloat(weight),
            date_recorded: date,
            notes: ''
          }
        ]);

      if (error) {
        setMessage('Error saving weight: ' + error.message);
      } else {
        setMessage('Weight saved successfully!');
        setWeight('');
        setDate('');
        fetchWeightEntries(); // Refresh the list
      }
    } catch (err) {
      setMessage('Error: ' + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header" style={{ minHeight: '100vh', padding: '20px' }}>
        <h1>My Wellness Tracker</h1>
        
        {/* Weight Entry Form */}
        <div style={{ 
          backgroundColor: 'white', 
          color: 'black', 
          padding: '30px', 
          borderRadius: '10px',
          maxWidth: '500px',
          width: '100%',
          margin: '20px 0'
        }}>
          <h2>Track Your Weight</h2>
          
          <form onSubmit={saveWeightEntry}>
            <div style={{ marginBottom: '15px' }}>
              <label>Weight (kg or lbs):</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter your weight"
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '5px',
                  borderRadius: '5px',
                  border: '1px solid #ddd'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Date:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '5px',
                  borderRadius: '5px',
                  border: '1px solid #ddd'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '15px 30px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                width: '100%'
              }}
            >
              {loading ? 'Saving...' : 'Save Weight Entry'}
            </button>
          </form>

          {message && (
            <p style={{ 
              marginTop: '15px', 
              color: message.includes('Error') ? 'red' : 'green' 
            }}>
              {message}
            </p>
          )}
        </div>

        {/* Weight History */}
        <div style={{ 
          backgroundColor: 'white', 
          color: 'black', 
          padding: '30px', 
          borderRadius: '10px',
          maxWidth: '500px',
          width: '100%',
          margin: '20px 0'
        }}>
          <h2>Weight History</h2>
          
          {weightEntries.length === 0 ? (
            <p>No weight entries yet. Add your first entry above!</p>
          ) : (
            <div>
              {weightEntries.map((entry, index) => (
                <div key={entry.id} style={{ 
                  borderBottom: '1px solid #eee', 
                  padding: '10px 0',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span><strong>{entry.weight} kg</strong></span>
                  <span>{new Date(entry.date_recorded).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;