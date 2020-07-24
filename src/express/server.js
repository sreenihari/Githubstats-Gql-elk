const express = require("express");
const fetch = require("node-fetch");
const app = express();
const fs = require("fs");
const Papa = require("papaparse");
const { parse } = require("path");
var _ = require("lodash");
const csvFilePath = "./InputOutput/repolist.csv";
const file = fs.createReadStream(csvFilePath);
let variables = [];
let noOfRecords = 0;

let query = `{`;
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
},`;
let cquery = `}`;

Papa.parse(file, {
  header: true,
  dynamicTyping: true,
  delimiter: "/",
  step: function (result) {
    variables.push(result.data);
  },
  complete: function (results, file) {
    for (var i = 0 in variables) {
      // console.log(variables[i]);
      ++noOfRecords;
      query =
        query +
        "id" +
        i +
        ":" +
        `repository(owner: "${variables[i].repoOwner}", name: "${variables[i].repoName}") {` +
        cbase;
    }

    query = query + cquery;
    //console.log(query)
  },
});

app.use(express.static("public"));

app.get("/data", async (req, res) => {
  const url = "https://api.github.com/graphql";

  const options = {
    method: "post",
    headers: {
      "content-type": "application/json",
      authorization: "bearer " + process.env.APIKEY,
    },
    body: JSON.stringify({ query: query, variables: variables }),
  };

  let response;
  try {
    response = await fetch(url, options);
    //console.log(options)
  } catch (error) {
    console.error(error);
  }
  const data = await response.json();
  res.json(data);

  let header = "Name\tClone URL\tDate of last commit\tName of last author";

  const fd = fs.openSync("./InputOutput/output.csv", "w+");

  fs.writeSync(fd, header, 0, "utf8");

  for (var i = 0 in variables) {
    let id = "id" + i;
    if (false === (_.get(data, "data.".concat(id)) === null)) {
      let name = _.get(data, "data.".concat(id).concat(".name"));
      //console.log(name)

      let clone_url = _.get(
        data,
        "data.".concat(id).concat(".object.repository.url")
      );
      //console.log(clone_url)

      let lastcommitdate = _.get(
        data,
        "data.".concat(id).concat(".object.author.date")
      );
      //console.log(lastcommitdate)

      let lastcommitname = _.get(
        data,
        "data.".concat(id).concat(".object.author.name")
      );
      //console.log(lastcommitname)

      let outputStr =
        "\n" +
        name +
        "\t" +
        clone_url +
        "\t" +
        lastcommitdate +
        "\t" +
        lastcommitname;

      fs.appendFileSync("./InputOutput/output.csv", outputStr);
    }
  }
});

app.listen(3000, () => console.log("Server started"));
