import React from 'react';

function Report() {
  return (
    <div>
      <h1>Report an Incident</h1>
      <p>Notify authorities or alert the community.</p>
      <button onClick={() => alert('Calling 911...')}>Call Emergency</button>
    </div>
  );
}

export default Report;
