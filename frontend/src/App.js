import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Predefined wellness questions
const WELLNESS_QUESTIONS = [
  "Did you drink enough water today?",
  "Did you exercise or move your body today?",
  "Did you get enough sleep last night?",
  "Did you eat nutritious meals today?",
  "Did you take time for mindfulness or relaxation?",
  "Did you take your vitamins/supplements?"
];

function App() {
  // Weight tracking state
  const [weight, setWeight] = useState('');
  const [weightDate, setWeightDate] = useState('');
  const [weightEntries, setWeightEntries] = useState([]);
  const [weightLoading, setWeightLoading] = useState(false);
  const [weightMessage, setWeightMessage] = useState('');

  // Food diary state
  const [mealType, setMealType] = useState('');
  const [foodDescription, setFoodDescription] = useState('');
  const [foodDate, setFoodDate] = useState('');
  const [foodNotes, setFoodNotes] = useState('');
  const [foodEntries, setFoodEntries] = useState([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodMessage, setFoodMessage] = useState('');

  // Daily checklist state
  const [checklistDate, setChecklistDate] = useState(new Date().toISOString().split('T')[0]);
  const [checklistAnswers, setChecklistAnswers] = useState({}); // Current session answers (not saved yet)
  const [savedAnswers, setSavedAnswers] = useState({}); // Answers loaded from database for this date
  const [checklistEntries, setChecklistEntries] = useState([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistMessage, setChecklistMessage] = useState('');

  // Quotes state
  const [currentQuote, setCurrentQuote] = useState(null);
  const [allQuotes, setAllQuotes] = useState([]);
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [newQuoteCategory, setNewQuoteCategory] = useState('');
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesMessage, setQuotesMessage] = useState('');

  // Load data when component starts
  useEffect(() => {
    fetchWeightEntries();
    fetchFoodEntries();
    fetchChecklistEntries();
    loadChecklistForDate(checklistDate);
    fetchQuotes();
    getRandomQuote();
  }, []);

  // Load checklist when date changes
  useEffect(() => {
    loadChecklistForDate(checklistDate);
  }, [checklistDate]);

  // Weight tracking functions
  const fetchWeightEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', '550e8400-e29b-41d4-a716-446655440000')
        .order('date_recorded', { ascending: false });

      if (error) {
        console.error('Error fetching weight entries:', error);
      } else {
        setWeightEntries(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const saveWeightEntry = async (e) => {
    e.preventDefault();
    
    if (!weight || !weightDate) {
      setWeightMessage('Please fill in both weight and date');
      return;
    }

    setWeightLoading(true);
    setWeightMessage('');

    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .insert([
          {
            user_id: '550e8400-e29b-41d4-a716-446655440000',
            weight: parseFloat(weight),
            date_recorded: weightDate,
            notes: ''
          }
        ]);

      if (error) {
        setWeightMessage('Error saving weight: ' + error.message);
      } else {
        setWeightMessage('Weight saved successfully!');
        setWeight('');
        setWeightDate('');
        fetchWeightEntries();
      }
    } catch (err) {
      setWeightMessage('Error: ' + err.message);
    }

    setWeightLoading(false);
  };

  // Food diary functions
  const fetchFoodEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('food_diary')
        .select('*')
        .eq('user_id', '550e8400-e29b-41d4-a716-446655440000')
        .order('date_recorded', { ascending: false });

      if (error) {
        console.error('Error fetching food entries:', error);
      } else {
        setFoodEntries(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const saveFoodEntry = async (e) => {
    e.preventDefault();
    
    if (!mealType || !foodDescription || !foodDate) {
      setFoodMessage('Please fill in meal type, food description, and date');
      return;
    }

    setFoodLoading(true);
    setFoodMessage('');

    try {
      const { data, error } = await supabase
        .from('food_diary')
        .insert([
          {
            user_id: '550e8400-e29b-41d4-a716-446655440000',
            meal_type: mealType,
            food_description: foodDescription,
            date_recorded: foodDate,
            notes: foodNotes
          }
        ]);

      if (error) {
        setFoodMessage('Error saving food entry: ' + error.message);
      } else {
        setFoodMessage('Food entry saved successfully!');
        setMealType('');
        setFoodDescription('');
        setFoodDate('');
        setFoodNotes('');
        fetchFoodEntries();
      }
    } catch (err) {
      setFoodMessage('Error: ' + err.message);
    }

    setFoodLoading(false);
  };

  // Daily checklist functions
  const loadChecklistForDate = async (date) => {
    try {
      const { data, error } = await supabase
        .from('daily_checklist')
        .select('*')
        .eq('user_id', '550e8400-e29b-41d4-a716-446655440000')
        .eq('date_recorded', date);

      if (data && data.length > 0) {
        // Load existing answers for this date
        const dateAnswers = {};
        data.forEach(entry => {
          dateAnswers[entry.question] = entry.answer;
        });
        setSavedAnswers(dateAnswers);
      } else {
        setSavedAnswers({});
      }
      
      // Clear current session answers when date changes
      setChecklistAnswers({});
      setChecklistMessage('');
    } catch (err) {
      console.error('Error loading checklist for date:', err);
    }
  };

  const handleAnswerChange = (question, answer) => {
    // Only update local state, don't save to database yet
    setChecklistAnswers(prev => ({
      ...prev,
      [question]: answer
    }));
  };

  const saveCompleteChecklist = async () => {
    // Get the current complete state (session answers override saved answers)
    const completeAnswers = { ...savedAnswers, ...checklistAnswers };
    
    if (Object.keys(completeAnswers).length === 0) {
      setChecklistMessage('Please answer at least one question before saving.');
      return;
    }

    setChecklistLoading(true);
    setChecklistMessage('Saving checklist...');

    try {
      // Process each question that has been answered
      for (const [question, answer] of Object.entries(completeAnswers)) {
        // Check if answer already exists for this date and question
        const { data: existing, error: fetchError } = await supabase
          .from('daily_checklist')
          .select('*')
          .eq('user_id', '550e8400-e29b-41d4-a716-446655440000')
          .eq('date_recorded', checklistDate)
          .eq('question', question);

        if (fetchError) {
          throw fetchError;
        }

        if (existing && existing.length > 0) {
          // Update existing answer only if it's different
          if (existing[0].answer !== answer) {
            const { error: updateError } = await supabase
              .from('daily_checklist')
              .update({ 
                answer: answer,
                created_at: new Date().toISOString() // Update timestamp to show when changed
              })
              .eq('id', existing[0].id);

            if (updateError) {
              throw updateError;
            }
            console.log(`Updated question "${question}" from ${existing[0].answer} to ${answer}`);
          }
        } else {
          // Insert new answer
          const { error: insertError } = await supabase
            .from('daily_checklist')
            .insert([
              {
                user_id: '550e8400-e29b-41d4-a716-446655440000',
                question: question,
                answer: answer,
                date_recorded: checklistDate,
                notes: ''
              }
            ]);

          if (insertError) {
            throw insertError;
          }
          console.log(`Inserted new question "${question}" with answer ${answer}`);
        }
      }

      setChecklistMessage('Checklist saved successfully!');
      
      // Clear current session answers after successful save
      setChecklistAnswers({});
      
      // Refresh data to ensure we're showing what's actually in the database
      await fetchChecklistEntries();
      await loadChecklistForDate(checklistDate);

      // Clear success message after 3 seconds
      setTimeout(() => setChecklistMessage(''), 3000);

    } catch (err) {
      console.error('Save error:', err);
      setChecklistMessage('Error saving checklist: ' + err.message);
    }

    setChecklistLoading(false);
  };

  const fetchChecklistEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_checklist')
        .select('*')
        .eq('user_id', '550e8400-e29b-41d4-a716-446655440000')
        .order('date_recorded', { ascending: false });

      if (error) {
        console.error('Error fetching checklist entries:', error);
      } else {
        setChecklistEntries(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Quotes functions
  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quotes:', error);
      } else {
        setAllQuotes(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getRandomQuote = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching random quote:', error);
        return;
      }

      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setCurrentQuote(data[randomIndex]);
      } else {
        // Set a default quote if no quotes in database
        setCurrentQuote({
          quote_text: "Welcome to your wellness journey! Start by adding some inspirational quotes.",
          author: "Your Wellness App",
          category: "motivation"
        });
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const saveQuote = async (e) => {
    e.preventDefault();
    
    if (!newQuoteText || !newQuoteCategory) {
      setQuotesMessage('Please fill in quote text and category');
      return;
    }

    setQuotesLoading(true);
    setQuotesMessage('');

    try {
      const { data, error } = await supabase
        .from('quotes')
        .insert([
          {
            quote_text: newQuoteText,
            author: newQuoteAuthor || null,
            category: newQuoteCategory,
            is_active: true
          }
        ]);

      if (error) {
        setQuotesMessage('Error saving quote: ' + error.message);
      } else {
        setQuotesMessage('Quote saved successfully!');
        setNewQuoteText('');
        setNewQuoteAuthor('');
        setNewQuoteCategory('');
        fetchQuotes();
        setTimeout(() => setQuotesMessage(''), 3000);
      }
    } catch (err) {
      setQuotesMessage('Error: ' + err.message);
    }

    setQuotesLoading(false);
  };

  const toggleQuoteActive = async (quoteId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ is_active: !currentStatus })
        .eq('id', quoteId);

      if (error) {
        console.error('Error toggling quote:', error);
      } else {
        fetchQuotes();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const formStyle = {
    backgroundColor: 'white', 
    color: 'black', 
    padding: '30px', 
    borderRadius: '10px',
    maxWidth: '500px',
    width: '100%',
    margin: '20px 0'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginTop: '5px',
    marginBottom: '15px',
    borderRadius: '5px',
    border: '1px solid #ddd'
  };

  const buttonStyle = {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '15px 30px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    width: '100%'
  };

  const yesNoButtonStyle = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    margin: '0 5px',
    minWidth: '60px'
  };

  return (
    <div className="App">
      <header className="App-header" style={{ minHeight: '100vh', padding: '20px' }}>
        <h1>My Wellness Tracker</h1>
        
        {/* Morning Quote/Meditation */}
        <div style={{
          ...formStyle,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center'
        }}>
          <h2>🌅 Daily Inspiration</h2>
          
          {currentQuote && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                fontSize: '18px', 
                fontStyle: 'italic', 
                lineHeight: '1.6',
                marginBottom: '15px',
                padding: '20px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '10px'
              }}>
                "{currentQuote.quote_text}"
              </div>
              
              {currentQuote.author && (
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  — {currentQuote.author}
                </div>
              )}
              
              <div style={{ 
                fontSize: '12px', 
                opacity: 0.8, 
                marginTop: '5px',
                textTransform: 'capitalize'
              }}>
                {currentQuote.category}
              </div>
            </div>
          )}

          <button
            onClick={getRandomQuote}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              padding: '12px 24px',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            ✨ Get New Inspiration
          </button>
        </div>

        {/* Add New Quote Form */}
        <div style={formStyle}>
          <h2>📝 Add New Quote</h2>
          
          <form onSubmit={saveQuote}>
            <div>
              <label>Quote/Meditation Cue:</label>
              <textarea
                value={newQuoteText}
                onChange={(e) => setNewQuoteText(e.target.value)}
                placeholder="Enter an inspiring quote or meditation cue..."
                style={{...inputStyle, height: '80px', resize: 'vertical'}}
              />
            </div>

            <div>
              <label>Author (optional):</label>
              <input
                type="text"
                value={newQuoteAuthor}
                onChange={(e) => setNewQuoteAuthor(e.target.value)}
                placeholder="Author name (leave blank if unknown)"
                style={inputStyle}
              />
            </div>

            <div>
              <label>Category:</label>
              <select
                value={newQuoteCategory}
                onChange={(e) => setNewQuoteCategory(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select category</option>
                <option value="motivation">Motivation</option>
                <option value="meditation">Meditation</option>
                <option value="wellness">Wellness</option>
                <option value="nutrition">Nutrition</option>
                <option value="mindfulness">Mindfulness</option>
                <option value="exercise">Exercise</option>
              </select>
            </div>

            <button type="submit" disabled={quotesLoading} style={buttonStyle}>
              {quotesLoading ? 'Saving...' : 'Add Quote'}
            </button>
          </form>

          {quotesMessage && (
            <p style={{ 
              marginTop: '15px', 
              color: quotesMessage.includes('Error') ? 'red' : 'green' 
            }}>
              {quotesMessage}
            </p>
          )}
        </div>

        {/* Manage Quotes */}
        <div style={formStyle}>
          <h2>📚 Your Quote Collection</h2>
          
          {allQuotes.length === 0 ? (
            <p>No quotes yet. Add your first quote above!</p>
          ) : (
            <div>
              {allQuotes.map((quote) => (
                <div key={quote.id} style={{ 
                  borderBottom: '1px solid #eee', 
                  padding: '15px 0',
                  opacity: quote.is_active ? 1 : 0.5
                }}>
                  <div style={{ fontStyle: 'italic', marginBottom: '5px' }}>
                    "{quote.quote_text}"
                  </div>
                  
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                    {quote.author && `— ${quote.author} • `}
                    <span style={{ textTransform: 'capitalize' }}>{quote.category}</span>
                    {!quote.is_active && " (Inactive)"}
                  </div>
                  
                  <button
                    onClick={() => toggleQuoteActive(quote.id, quote.is_active)}
                    style={{
                      backgroundColor: quote.is_active ? '#f44336' : '#4CAF50',
                      color: 'white',
                      border: 'none',
                      padding: '5px 15px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {quote.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Checklist */}
        <div style={formStyle}>
          <h2>✅ Daily Wellness Checklist</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label>Date:</label>
            <input
              type="date"
              value={checklistDate}
              onChange={(e) => setChecklistDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {WELLNESS_QUESTIONS.map((question, index) => {
            // Get current answer (from session or saved)
            const currentAnswer = checklistAnswers.hasOwnProperty(question) 
              ? checklistAnswers[question] 
              : savedAnswers[question];
            
            const hasUnsavedChange = checklistAnswers.hasOwnProperty(question);
            
            return (
              <div key={index} style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                backgroundColor: hasUnsavedChange ? '#fff3cd' : '#f9f9f9', // Highlight unsaved changes
                borderRadius: '5px',
                border: hasUnsavedChange ? '2px solid #ffc107' : '1px solid #eee'
              }}>
                <div style={{ marginBottom: '10px', fontWeight: '500' }}>
                  {question}
                  {hasUnsavedChange && (
                    <span style={{ 
                      marginLeft: '10px', 
                      fontSize: '12px', 
                      color: '#856404',
                      fontStyle: 'italic'
                    }}>
                      (unsaved change)
                    </span>
                  )}
                </div>
                <div>
                  <button
                    style={{
                      ...yesNoButtonStyle,
                      backgroundColor: currentAnswer === true ? '#4CAF50' : '#e0e0e0',
                      color: currentAnswer === true ? 'white' : 'black'
                    }}
                    onClick={() => handleAnswerChange(question, true)}
                  >
                    Yes
                  </button>
                  <button
                    style={{
                      ...yesNoButtonStyle,
                      backgroundColor: currentAnswer === false ? '#f44336' : '#e0e0e0',
                      color: currentAnswer === false ? 'white' : 'black'
                    }}
                    onClick={() => handleAnswerChange(question, false)}
                  >
                    No
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={saveCompleteChecklist}
            disabled={checklistLoading || Object.keys(checklistAnswers).length === 0}
            style={{
              ...buttonStyle,
              backgroundColor: Object.keys(checklistAnswers).length > 0 ? '#4CAF50' : '#cccccc',
              cursor: Object.keys(checklistAnswers).length > 0 ? 'pointer' : 'not-allowed',
              marginTop: '20px'
            }}
          >
            {checklistLoading ? 'Saving...' : 
             Object.keys(checklistAnswers).length === 0 ? 'No changes to save' :
             `Save Changes (${Object.keys(checklistAnswers).length} modified)`}
          </button>

          {checklistMessage && (
            <p style={{ 
              marginTop: '15px', 
              color: checklistMessage.includes('Error') ? 'red' : 'green',
              textAlign: 'center'
            }}>
              {checklistMessage}
            </p>
          )}
        </div>

        {/* Weight Entry Form */}
        <div style={formStyle}>
          <h2>📊 Track Your Weight</h2>
          
          <form onSubmit={saveWeightEntry}>
            <div>
              <label>Weight (kg or lbs):</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter your weight"
                style={inputStyle}
              />
            </div>

            <div>
              <label>Date:</label>
              <input
                type="date"
                value={weightDate}
                onChange={(e) => setWeightDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button type="submit" disabled={weightLoading} style={buttonStyle}>
              {weightLoading ? 'Saving...' : 'Save Weight Entry'}
            </button>
          </form>

          {weightMessage && (
            <p style={{ 
              marginTop: '15px', 
              color: weightMessage.includes('Error') ? 'red' : 'green' 
            }}>
              {weightMessage}
            </p>
          )}
        </div>

        {/* Weight History */}
        <div style={formStyle}>
          <h2>📈 Weight History</h2>
          
          {weightEntries.length === 0 ? (
            <p>No weight entries yet. Add your first entry above!</p>
          ) : (
            <div>
              {weightEntries.slice(0, 5).map((entry) => (
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

        {/* Food Diary Form */}
        <div style={formStyle}>
          <h2>🍽️ Food Diary</h2>
          
          <form onSubmit={saveFoodEntry}>
            <div>
              <label>Meal Type:</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select meal type</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <div>
              <label>What did you eat?</label>
              <textarea
                value={foodDescription}
                onChange={(e) => setFoodDescription(e.target.value)}
                placeholder="Describe your meal (e.g., Grilled chicken salad with vegetables)"
                style={{...inputStyle, height: '80px', resize: 'vertical'}}
              />
            </div>

            <div>
              <label>Date:</label>
              <input
                type="date"
                value={foodDate}
                onChange={(e) => setFoodDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label>Notes (optional):</label>
              <input
                type="text"
                value={foodNotes}
                onChange={(e) => setFoodNotes(e.target.value)}
                placeholder="Any additional notes..."
                style={inputStyle}
              />
            </div>

            <button type="submit" disabled={foodLoading} style={buttonStyle}>
              {foodLoading ? 'Saving...' : 'Save Food Entry'}
            </button>
          </form>

          {foodMessage && (
            <p style={{ 
              marginTop: '15px', 
              color: foodMessage.includes('Error') ? 'red' : 'green' 
            }}>
              {foodMessage}
            </p>
          )}
        </div>

        {/* Food History */}
        <div style={formStyle}>
          <h2>📝 Food History</h2>
          
          {foodEntries.length === 0 ? (
            <p>No food entries yet. Add your first meal above!</p>
          ) : (
            <div>
              {foodEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} style={{ 
                  borderBottom: '1px solid #eee', 
                  padding: '15px 0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {entry.meal_type}
                    </span>
                    <span>{new Date(entry.date_recorded).toLocaleDateString()}</span>
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    {entry.food_description}
                  </div>
                  {entry.notes && (
                    <div style={{ fontSize: '0.9em', color: '#666', fontStyle: 'italic' }}>
                      Notes: {entry.notes}
                    </div>
                  )}
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