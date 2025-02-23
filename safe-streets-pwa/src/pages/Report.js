import React, { useState } from 'react';
import './styles/Report.css';

function Report() {
  const [reportText, setReportText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulate calling police using a telephone link
  const handleCallPolice = () => {
    window.location.href = 'tel:911'; // Change to appropriate number if needed
  };

  // Simulate calling an ambulance
  const handleCallAmbulance = () => {
    window.location.href = 'tel:911'; // Change if ambulance has a different number
  };

  // Simulate sending a report
  const handleSendReport = () => {
    if (!reportText.trim()) {
      alert('Please describe the situation before sending the report.');
      return;
    }
    setIsSubmitting(true);
    // Simulate a delay (replace with your API call)
    setTimeout(() => {
      alert('Report sent successfully!');
      setReportText('');
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <div className="report-container">
      <h1>Report an Incident</h1>
      <p>Notify authorities or alert the community about your current situation.</p>
      
      <div className="button-group">
        <button className="emergency-btn" onClick={handleCallPolice}>
          Call Police
        </button>
        <button className="emergency-btn" onClick={handleCallAmbulance}>
          Call Ambulance
        </button>
      </div>

      <div className="report-form">
        <textarea
          placeholder="Describe the current situation..."
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          rows="5"
        ></textarea>
        <button className="send-btn" onClick={handleSendReport} disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Report'}
        </button>
      </div>
    </div>
  );
}

export default Report;
