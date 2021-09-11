/*
Purpose: This code will facilitate reading from a local CSV file, parsing into
         JSON format and calling to a web service endpoint.
Author: Soleil Cotterell
*/
//We use this module to facilitate parsing CSV
const papa = require("papaparse");
//We use this built in file system module to read local files
const fs = require('fs');
const https = require('https');

main()

async function main(){
  let [oCourses, oSubjectCodes, oGroups, oCampus] = await Promise.all([csvToJson(), requestSubjectCodes(),requestGroups(),requestCampus()]);
  //console.log(oCourses)
  //console.log(oSubjectCodes)
  //console.log(oGroups)
  //console.log(oCampus);
  oCourses.forEach((item, i) => {
    let obj = constructObjForPost(item,oSubjectCodes,oGroups,oCampus);
    console.log(obj)
    postToEndpoint(obj);
  });

}


//Description: Reads courses.csv file into an array of JS objects
function csvToJson(){
  const file = fs.createReadStream('courses.csv');

  return new Promise((resolve,reject) =>  {
    papa.parse(file,{
      header: true,
      complete: function (results){
        resolve(results.data)}
      });
  })
}

//Description: Requests subject code information from the subjectcodes endpoint
async function requestSubjectCodes() {
  let obj = {};
  return new Promise((resolve,reject) =>  {
    const req = https.get('https://stucse.kuali.co/api/cm/options/types/subjectcodes',{
      headers: {
        Authorization: "Bearer "
      }},
      res => {
        let str = "";
        res.on('data', chunk => {
          str += chunk;
        })

        res.on('end', data => {
          obj =  JSON.parse(str);
          resolve(obj);
        })
      })
    })
  req.end;
}

//Description: Requests subject group information from the groups endpoint
async function requestGroups() {
  let obj = {};
  return new Promise((resolve,reject) =>  {
    const req = https.get('https://stucse.kuali.co/api/v1/groups/',{
      headers: {
        Authorization: "Bearer "
      }},
      res => {
        let str = "";
        res.on('data', chunk => {
          str += chunk;
        })

        res.on('end', data => {
          obj =  JSON.parse(str);
          resolve(obj);
        })
      })
    })
  req.end;
}

//Description: Requests campus information from the campuses endpoint
async function requestCampus() {
  let obj = {};
  return new Promise((resolve,reject) =>  {
    const req = https.get('https://stucse.kuali.co/api/cm/options/types/campuses',{
      headers: {
        Authorization: "Bearer "
      }},
      res => {
        let str = "";
        res.on('data', chunk => {
          str += chunk;
        })

        res.on('end', data => {
          obj =  JSON.parse(str);
          resolve(obj);
        })
      })
    })
  req.end;
}

//Description: Constructs a javascript object following the specification that we will later convert to JSON
function constructObjForPost(oCourse,oSubjectCodes,oGroups,oCampus){
  let obj = {};

  obj.subjectCode = getSubjectId(oCourse,oSubjectCodes);
  obj.number = oCourse.number;
  obj.title = oCourse.title;
  obj.credits = getCreditObject(oCourse);
  obj.status = "draft";
  obj.dateStart = getDateString(oCourse);

  let groupFilterArray = getGroupFilter(oCourse,oGroups);
  if (groupFilterArray.length){
    [obj.groupFilter1, obj.groupFilter2] = groupFilterArray;
  }

  obj.campus = getCampusObject(oCourse,oCampus);
  obj.notes = "Submitted by Soleil Cotterell";

  return obj;
}

function getSubjectId(oCourse,oSubjectCodes){
  for (const item of oSubjectCodes) {
    if (item.name === oCourse.subjectCode){
      return item.id;
    }
  }
}

//Description: Constructs a credit object that will conform to the credit requirement laid out in the specification
function getCreditObject(oCourse){
  let oCredit = {}
  oCredit.chosen = oCourse.creditType;
  switch(oCourse.creditType){
    case 'fixed':
      oCredit.credits = {min: oCourse.creditsMin, max: oCourse.creditsMin};
      oCredit.value = oCourse.creditsMin;
      break;
    case 'multiple':
      oCredit.credits = {max: oCourse.creditsMax, min: oCourse.creditsMin};
      oCredit.value = [oCourse.creditsMin, oCourse.creditsMax]
      break;
    case 'range':
      let oCreditRange = {min: oCourse.creditsMin, max: oCourse.creditsMax};
      oCredit.credits = oCreditRange;
      oCredit.value = oCreditRange;
      break;
  }
  return oCredit;
}

//Description: Constructs a date string for use in the JSON according to the specification
function getDateString(oCourse){
  let dateStart = oCourse.dateStart;
  let [semester, year] = dateStart.split(' ');
  //console.log(dateStart);
  switch(semester){
    case "Winter":
      return year + '-01-01';
    case "Spring":
      return year + '-04-03';
    case "Summer":
      return year + '-07-04';
    case "Fall":
      return year + '-10-04';
  }

}

//Description: Returns the Group Filter IDs as required by the specification (for use in the JS object and JSON)
function getGroupFilter(oCourse,oGroups){
  for (const item of oGroups) {
    if (item.name === oCourse.department){
      return [item.id, item.parentId];
    }
  }
  return []
}

//Description: Constructs a campus object for use in the JS object/JSON
function getCampusObject(oCourse,oCampus){
  let oTemp = {}
  for (const item of oCampus) {
    if (oCourse.campus.includes(item.name)){
      oTemp[item.id] = true;
    }
  }
  return oTemp;
}

//Method to actually convert the JS object into JSON and then POST it to the requested endpoint.
function postToEndpoint(obj){
  const data = JSON.stringify(obj);
  console.log(data)
  
  const options = {
    hostname: 'stucse.kuali.co',
    port: 443,
    path: '/api/cm/courses/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      Authorization: "Bearer "
    }
  }
  const req = https.request(options,res => {
      let str;
      res.on('data', chunk => {
        str += chunk;
      })
      console.log(res.statusCode);
  })
req.write(data)
req.end;
}
