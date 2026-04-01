
import Fuse from 'fuse.js'
import React, { useState, useEffect } from "react";
import mockData from './mock-data.json'


function Search({ data = mockData, onSelect }) {
  const [searchResults, setSearchResults] = useState(data);

  useEffect(() => {
    setSearchResults(data);
  }, [data]);

  const options = {
    includeScore: true,
    includeMatches: true,
    threshold: 0.2,
    keys: ["username", "name", "tag", "audioSource"],
  };

  const fuse = new Fuse(data, options);

  const handleSearch = (event) => {
    const { value } = event.target;

    if (value.length === 0) {
      setSearchResults(data);
      return;
    }

    const results = fuse.search(value);
    const items = results.map((result) => result.item);
    setSearchResults(items);
  };

  return (
    <div>
      <input
        type="text"
        onChange={handleSearch}
        placeholder="Search presets..."
      />
      <ul>
        {searchResults.map((item, index) => (
          <li
            key={index}
            onClick={() => onSelect && onSelect(item)}
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
          >
            {item.name} — {item.username}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Search;
