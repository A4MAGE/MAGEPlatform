const Fuse = require('fuse.js');

const fuseOptions = {

	keys: [
		"title",
		"author.firstName"
	]
};

const fuse = new Fuse(list, fuseOptions);


const searchPattern = ""

return fuse.search(searchPattern)
