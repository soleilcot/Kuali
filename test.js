/*
Purpose: This code will facilitate reading from a local CSV file, parsing into
         JSON format and calling to a web service endpoint.
*/
//We will use Papa Parse module to read CSV file into an array of JavaScript objects.

const papa = require("papaparse")
const fs = require('fs')
const file = fs.createReadStream('courses.csv')
console.log(file)
papa.parse(file,{header: true,complete: function(results){
  console.log(results);
}
});
