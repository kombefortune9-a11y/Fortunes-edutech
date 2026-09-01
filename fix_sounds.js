const fs = require('fs');
let content = fs.readFileSync('src/data/obeEnglishZambianData.ts', 'utf8');

// The broken pattern is:
// "something"], learningActivities: ["something"
// which causes duplicate keys. 

// Actually, let's just find any place where learningActivities is duplicated in the same object block.
// Or easier, let's look at git status? Oh, I don't have git.

// Let's replace the broken blocks.
// Wait, the regex replaced 75 occurrences. I can reverse engineer the script.
// The script replaced:
// title: "(.*?Sound.*?)", competencies: [(.*?)], learningActivities: [(.*?)], expectedStandard: [(.*?)]
// with multiple blocks.
// Since the string replacement overwrote chunks of the file, information like the original competencies and activities might be lost if the regex skipped over intermediate things.
// Did the regex skip?
// yes, /\{ title: "(.*?Sound.*?)", competencies: \[(.*?)\], learningActivities: \[(.*?)\], expectedStandard: \[(.*?)\] \}/g
// This means it matched the FIRST title, and the LAST expectedStandard in a massive block, deleting everything in between!
