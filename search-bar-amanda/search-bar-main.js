
import Fuse from 'fuse.js'
import React, { useState } from "react";
import data from '../mock-data.json'


function Search() {
  const [searchResults, setSearchResults] = useState(data);
  const options = {
    includeScore: true,
    includeMatches: true,
    threshold: 0.2,
    keys: ["author", "name", "tag", "audioSource"],
  };

  const fuse = new Fuse(data, options);


const handleSearch = (event) => {        // moved INSIDE the component
    const { value } = event.target;

    if (value.length === 0) {
      setSearchResults(data);              // was `initialData`
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
        placeholder="Search..."
      />
      <ul>
        {searchResults.map((item, index) => (
          <li key={index}>{item.name}</li>  
        ))}
      </ul>
    </div>
  );
}
export default Search;
