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
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwZjg0Mjg4ODcyOGJlMDEwNjY0MmQ2MCIsImlzcyI6Imt1YWxpLmNvIiwiZXhwIjoxNjU4NDE4Njk2LCJpYXQiOjE2MjY4ODI2OTZ9.WCdRFv7EOF8LCZ9ElvZfYcFsPVGvxo0x9QduBmICpKI"
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
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwZjg0Mjg4ODcyOGJlMDEwNjY0MmQ2MCIsImlzcyI6Imt1YWxpLmNvIiwiZXhwIjoxNjU4NDE4Njk2LCJpYXQiOjE2MjY4ODI2OTZ9.WCdRFv7EOF8LCZ9ElvZfYcFsPVGvxo0x9QduBmICpKI"
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
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwZjg0Mjg4ODcyOGJlMDEwNjY0MmQ2MCIsImlzcyI6Imt1YWxpLmNvIiwiZXhwIjoxNjU4NDE4Njk2LCJpYXQiOjE2MjY4ODI2OTZ9.WCdRFv7EOF8LCZ9ElvZfYcFsPVGvxo0x9QduBmICpKI"
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
  obj.status = "draft";
  obj.dateStart = getDateString(oCourse);
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
