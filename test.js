/*
Purpose: This code will facilitate reading from a local CSV file, parsing into
         JSON format and calling to a web service endpoint.
*/
//We use this module to facilitate parsing CSV
const papa = require("papaparse")
//We use this built in file system module to read local files
const fs = require('fs')
const file = fs.createReadStream('courses.csv')

//Parse the CSV data we read from file into an array of native objects
papa.parse(file,{header: true,complete: function(results){
  console.log(results.data);
}
});
