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
  });

}

/*
Description: Reads courses.csv file into an array of JS objects
*/
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

//Parse the CSV data we read from file into an array of native objects
async function requestSubjectCodes() {
  let obj = {};
  return new Promise((resolve,reject) =>  {
    const req = https.get('https://stucse.kuali.co/api/cm/options/types/subjectcodes',{
      headers: {
        Authorization: "Bearer ***REMOVED***"
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

async function requestGroups() {
  let obj = {};
  return new Promise((resolve,reject) =>  {
    const req = https.get('https://stucse.kuali.co/api/v1/groups/',{
      headers: {
        Authorization: "Bearer ***REMOVED***"
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

async function requestCampus() {
  let obj = {};
  return new Promise((resolve,reject) =>  {
    const req = https.get('https://stucse.kuali.co/api/cm/options/types/campuses',{
      headers: {
        Authorization: "Bearer ***REMOVED***"
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

function constructObjForPost(oCourse,oSubjectCodes,oGroups,oCampus){
  let obj = {};

  obj.subjectCode = getSubjectId(oCourse,oSubjectCodes);
  obj.number = oCourse.number;
  obj.title = oCourse.title;
  obj.credits = getCreditObject(oCourse);
  obj.status = "draft"
  console.log(obj)


}

function getSubjectId(oCourse,oSubjectCodes){
  for (const item of oSubjectCodes) {
    if (item.name === oCourse.subjectCode){
      return item.id;
    }
  }
}

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
/*
function onCsvParseComplete(results){

  console.log(ret)
  return 1
  results.data.forEach((item, i) => {
    //Limit to one iteration for now so that we can perfect the logic first
    if (i !== 1) {return;};
    //Iterate through the current object
    for (let key in item){
      //console.log(key + ": " + item[key]);
    }
  })
}
*/
