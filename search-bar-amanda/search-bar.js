import data from '../mock-data/json'
const Fuse = require('fuse.js');

const fuseOptions = {
	
	keys: [
		"title",
		"author.firstName",
		"tag",
		"audio source".
	
	]
};

const fuse = new Fuse(list, fuseOptions);

// Change the pattern
const searchPattern = ""

return fuse.search(searchPattern)
