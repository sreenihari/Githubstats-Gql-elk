const express = require('express')
const fetch = require('node-fetch')
const app = express()
const fs = require('fs');
const Papa = require('papaparse');
const { parse } = require('path');

const csvFilePath = './public/repolist.csv'

const file = fs.createReadStream(csvFilePath);

let variables=[]

let query = `{`
let cbase = `object(expression: "master") {
  ... on Commit {
    author {
      date
      name
    }
  }
  repository {
    url
  }
}
name
},`
let cquery = `}`


Papa.parse(file, {
  header: true,
  dynamicTyping : true,
  delimiter : '/',
  step: function(result) {
  
    variables.push(result.data)
  },
  complete: function(results, file) {

     for (var i = 0 in variables) {
     // console.log(variables[i]);
      query = query + "id" + i + ":" +
              `repository(owner: "${variables[i].repoOwner}", name: "${variables[i].repoName}") {` + 
              cbase
      
    }

    query = query + cquery
    //console.log(query)
  }})

app.use(express.static('public'))

app.get('/data', async (req, res) => {
  
  const url = 'https://api.github.com/graphql'
  
  const options = {
    method: 'post',
    headers: {
      'content-type': 'application/json',
      'authorization': 'bearer ' + process.env.APIKEY
    },
    body: JSON.stringify({ 'query': query ,'variables': variables }),
  }

  let response
  try {
    response = await fetch(url, options)
    //console.log(options)

  } catch (error) {
    console.error(error)
  }
  const data = await response.json()
  res.json(data)
  
  const replacer = (key, value) =>
  typeof value === 'undefined' ? null : value;

  op = JSON.stringify(data, replacer, "    ")

  let jsonString = JSON.parse(op)
  //console.log(jsonString.data.id0.name)
  //console.log(
   // Object.keys(jsonString).map(function(key){ return data[key] }))

   for(let r in jsonString){  //for in loop iterates all properties in an object
    //console.log(r) ;  //print all properties in sequence
    //console.log(jsonString[r]);//print all properties values
    for(let q in jsonString[r]){
     // console.log(jsonString[r][q].author);
     for (var key in Object.keys(jsonString[r][q])) {
      var t = Object.keys(jsonString[r][q])[key];
      console.log(t + " value =: " + jsonString[t]);
      
    }
    }
   }

   /*  this is the answer here  */
for (var key in Object.keys(jsonString)) {
  var t = Object.keys(jsonString)[key];
  console.log(t + " value =: " + jsonString[t]);
  
}


  /*function toCSV(json) {
    json = Object.values(json);
    var csv = "";
    var keys = (json[0] && Object.keys(json[0])) || [];
    //console.log(keys)
    csv += keys.join(',') ;
    for (var line of json) {
      //console.log(line)
      csv += keys.map(key => line[key]).join(',') ;
    }
    return csv;
  }/*
  
  fs.writeFileSync('./public/output.csv',toCSV(op));

   //op = JSON.stringify(data, null, "    ")
 
   /*try {
    fs.writeFileSync('user.json', op);
    console.log("JSON data is saved.");
} catch (error) {
    console.error(err);
}*/
 

})

app.listen(3000, () => console.log('Server started'))


