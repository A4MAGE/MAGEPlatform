import data from '../mock-data/json'
import Fuse from 'fuse.js';

const fuseOptions = {
	
	keys: [
		"author",
		"name",
		"tag",
		"audio source".
	
	]
};

const fuse = new Fuse(list, fuseOptions);

// Change the pattern
//const searchPattern = ""

//return fuse.search(searchPattern)
