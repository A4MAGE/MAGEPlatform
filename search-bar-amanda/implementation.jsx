import React, { useState } from 'react';
import Fuse from 'fuse.js';

// Assume 'books' data from step 2 is here
const App = () => {
  const [query, setQuery] = useState('');
  
  // Create fuse instance
  const fuse = new Fuse(preset, { keys: ['author', 'name', 'tag', 'audio source'] });
  
  // Perform search
  const results = fuse.search(query);
  const searchResults = query ? results.map(result => result.item) : books;

  const handleSearch = (e) => {
    setQuery(e.target.value);
  };

  return (
    <div>
      <input 
        type="text" 
        value={query} 
        onChange={handleSearch} 
        placeholder="Search books..." 
      />
      <ul>
        {searchResults.map((preset, index) => (
         // <li key={index}>{prset.title} - {pre.author}</li>
        ))}
      </ul>
    </div>
  );
};
