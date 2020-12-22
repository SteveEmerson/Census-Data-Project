/* Census Data Analysis
  Data from census.gov using their provided API

  Started Dec 21, 2020

  Steve Emerson
*/

// Get the container
let dataContainer = document.querySelector('#data-container');
let dataTable = document.querySelector('#data-table');

/* First Trial ... using National Population Monthly Estimates for 2019
  https://api.census.gov/data/2019/pep/natmonthly

  Attempt to fetch US population estimates for a given month from 2010 to 2020
*/

let baseURL = '	https://api.census.gov/data/2019/pep/natmonthly'
let key = 'ecafbb12e896f57dfc69d7d7baa53cfd2a2dadaa'

// Driver
let year = 2005;
let month = 1;

let monthly//
getCensusData();

// Getting the data
function getCensusData() {
  let getVariables = '?get=NAME,POP&MONTHLY=1&for=us:1';
  let url = baseURL + getVariables;

  fetch(url)
    .then(response => response.json())
    .then((censusData) => {
      console.log(censusData)
      buildTable(censusData);
    })
    .catch((err) => {
      console.log("Failed fetch!")
      console.log("err");
    });

}

function buildTable(data){
  
  for(let i = 0; i < data.length; i++){
    
    let dataRow = document.createElement('tr');
    dataRow.id = 'data-row';

    data[i].forEach((value) => {
      let cellType = (i === 0) ? 'th' : 'td';
      let td = document.createElement(cellType);
      td.textContent = value;
      td.className = 'table-data';
      dataRow.appendChild(td);
    });
  
    dataTable.appendChild(dataRow);
  }

}


