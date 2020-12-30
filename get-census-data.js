/* Census Data Analysis
  Data from census.gov using their provided API

  Started Dec 21, 2020

  Steve Emerson
*/

// Get the containers
let chartContainer = document.querySelector("#chart-container");
let dataContainer = document.querySelector('#data-container');
let dataTable = document.querySelector('#data-table');

/* First Trial ... using Population Estimates: National Population Monthly Estimates for 2019
  https://api.census.gov/data/2019/pep/natmonthly

  Attempt to fetch US population estimates for a given month from 2010 to 2020
*/

let baseURL = '	https://api.census.gov/data/2019/pep/natmonthly'
let key = 'ecafbb12e896f57dfc69d7d7baa53cfd2a2dadaa'

// All needed labels
let labels = {}; 

// Build form elements
buildForm();

// Get data for a month and build the table row
function getMonthlyPopEstimate(startMonth, endMonth, variable) {
  //NOTE order of variabled in request determines order in the returned array
  //let getVariables = `MONTHLY_DESC,POP&MONTHLY=${startMonth}:${endMonth}&for=us:*`;
  let option;

  switch (variable) {
    case "sex":
      option = "&SEX=0:2";
      break;
    case "age":
      option = "&AGE=0:100";
      break;
    case "hisp-origin":
      option = "&HISP=0:2";
      break;
    case "race":
      option = "&RACE=0:11";
      break;
    default:
      option = "";
  }

  let getVariables = `MONTHLY_DESC,POP${option}&MONTHLY=${startMonth}:${endMonth}&for=us:*`;

  let url = baseURL + '?get=' + getVariables + '&key=' + key;

  fetch(url)
    .then(response => response.json())
    .then((censusData) => {
      console.log(censusData)
      let processedData = processData(censusData);  /* IS THIS WORKING ENTIRELY? */
      //displayData(processedData);
      buildChart(processedData);
    })
    .catch((err) => {
      console.log("Failed fetch!")
      console.log(err);
    });

}

// Build form elements
function buildForm(){

  // add event listener to form
  let form = document.querySelector("form");

  form.addEventListener("submit", function(event){
    event.preventDefault();
    var formData = new FormData(form);
    for (const entry of formData){
      console.log(entry);
    }
    getPopData(formData);
  });

  // Fetch labels and build start month select options
  let startMonthSelect = document.querySelector("#start-month-select");
  getLabels('MONTHLY')
    .then((monthLabels) => {
      
      labels['MONTHLY'] = monthLabels;
      //console.log(labels.MONTHLY);

      let allOption = document.createElement("option");
        allOption.value = "0";
        allOption.textContent = "all";
        startMonthSelect.appendChild(allOption);

      //Label at key "1" is the census population for 4/1/2010 ... skip that one
      for(let i = 2; i <= Object.keys(monthLabels).length; i++){
        let dateOption = document.createElement("option");
        dateOption.value = i;
        dateOption.textContent = monthLabels[i].split(" ")[0];
        startMonthSelect.appendChild(dateOption);
      }
    })
    .catch(err => {
      console.log("Failed month label fetch: " + err);
    });
    
}

//Getting labels
function getLabels(dataVar){
  let url = baseURL + '/variables' + '/' + dataVar.toUpperCase() + '.json';
  let dataLabels = fetch(url)
    .then(response => response.json())
    .then((labelData) => {
      return labelData.values.item;
    })
    .catch((err) => {
      console.log('Failed label fetch');
      console.log(err);
    });
  return dataLabels;
}

// add end month select and options
function addEndDate(e) {

  let monthRangeFields = document.querySelector("#month-range-fields");
  let startMonthSelect = document.querySelector("#start-month-select");
  let startMonth = Number(startMonthSelect.value);

  if(startMonth !== 0){

    let endMonthSelect;
    let endMonthSpan;

    if(monthRangeFields.childElementCount > 2){
      endMonthSpan = monthRangeFields.lastElementChild;
      endMonthSelect = endMonthSpan.lastElementChild;
      while(endMonthSelect.lastElementChild){
        endMonthSelect.remove(endMonthSelect.lastElementChild);
      }
    }else{
      endMonthSpan = document.createElement("span");
      endMonthSpan.innerHTML = '<label for="end-month-select">Select an ending month</label>';
      endMonthSelect = document.createElement("select");
      endMonthSelect.id = "end-month-select"
      endMonthSelect.name = "end";
    }
    
    for(let i = startMonth; i <= Object.keys(labels.MONTHLY).length; i++){
      let dateOption = document.createElement("option");
      dateOption.value = i;
      dateOption.textContent = labels.MONTHLY[i].split(" ")[0];
      endMonthSelect.appendChild(dateOption);
    }

    endMonthSpan.appendChild(endMonthSelect);
    monthRangeFields.appendChild(endMonthSpan);

  }else{
    while(monthRangeFields.childElementCount > 2){
      monthRangeFields.removeChild(monthRangeFields.lastElementChild);
    }
  }

}

function getPopData(formData){

  let startMonth = formData.get("start");
  let endMonth;

  if(startMonth !== "0"){
    endMonth = formData.get("end");
  }else{
    endMonth = Object.keys(labels.MONTHLY).length;
  }

  let variable = formData.get("variable");

  getMonthlyPopEstimate(startMonth, endMonth, variable);

}

function processData(data){

  for(let i = 1; i < data.length; i++){
    data[i][0] = data[i][0].split(" ")[0];   //Remove extra text from the month label ... only need the date string
    data[i][0] = convertToDate(data[i][0]);  //Convert the date string to a date object
  }

  //console.log(data[1]);

  // if the first two population entries have the same date, remove the first
  if (data.length >2 && data[1][0].getMonth() === data[2][0].getMonth()){
    data.splice(1,1);
  }

  // data sometimes comes back out of order ... not sure why .... this is an attempt to
  // sort the data appropriately ... 
  data.sort(function(a, b) {
    return (a[0] - b[0]);   
  });

  return data;
}

//Assumes the date string is m[m]/d[d]/yyyy format
function convertToDate(dateString){
  
  let dateSplit = dateString.split("/");
  let month = parseInt(dateSplit[0]) - 1;
  let day = parseInt(dateSplit[1]);
  let year = parseInt(dateSplit[2]);

  return new Date(year, month, day);
}

function displayData(data){

  // Remove any existing data from the table
  while(dataTable.firstElementChild){
    dataTable.removeChild(dataTable.firstElementChild);
  }

  // make the header
  //let headerData = data.shift();  //Column headers
  let headerData = data[0];
  buildHeader(headerData);

  for(let i = 1; i < data.length; i++){
    buildRow(data[i], i);
  }
}

function buildHeader(data) {

  let headerRow = document.createElement('tr');
  headerRow.id = 'header-row';

  for(let i = 0; i < data.length - 2; i++){
    let th = document.createElement('th');
    th.textContent = data[i];
    th.className = 'table-header';
    this.id = 'h-'+ i;
    headerRow.appendChild(th);
  }

  dataTable.appendChild(headerRow);
}

function buildRow(data, month){
  
    let dataRow = document.createElement('tr');
    dataRow.className = 'data-row';
    dataRow.id = 'month-'+month;

    // Use this in case the data will contain more than just two vars
    // Assumes the month is always the first variable in the fetch
    for(let i = 0; i < data.length - 2; i++){
      let td = document.createElement('td');
      if(i === 0){
        let options = { month: 'short'};
        let month = new Intl.DateTimeFormat('en-US', options).format(data[i]);
        let year = data[i].getFullYear();
        td.textContent = `${month} ${year}`;
      }else{
        td.textContent = data[i];
      }
      td.className = 'var-' + i + ' ' + 'month-' + month;
      td.id = month + '-' + i;
      dataRow.appendChild(td);
    }
    
    dataTable.appendChild(dataRow);

}

//Use d3 to build a bar chart
function buildChart(dataset){

  while(chartContainer.firstElementChild){
    chartContainer.removeChild(chartContainer.firstElementChild);
  }

  //console.log(dataset);

  let headers = dataset.shift();

  //extract date and populations dataset
  let popdata = [];
  let datedata = [];
  dataset.forEach((x) =>{
    popdata.push(parseInt(x[1], 10))
    datedata.push(x[0]);
  });

  
  let dataLength = dataset.length

  // get the min and max pop value
  let maxPop = d3.max(popdata, d => d);
  let minPop = d3.min(popdata, d => d);

  console.log(minPop + " " + maxPop)

    // get the min and max date value
  let maxDate = d3.max(datedata, d => d);
  let minDate = d3.min(datedata, d => d);
  
  console.log(minDate + " to " + maxDate);

  let chartWidth = 800;
  let margin = {top: 40, right: 20, bottom:20, left: 60}
  let chartHeight = 300;
  let skewDiff = 0.99  // 0 (absolute) to 1 (relative to range)

  //chart svg elemen
  let svgBarChart = d3
    .select("#chart-container")
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight);

  //scales
  // let heightScale = d3.scaleLinear()
  //   .domain([skewDiff*minPop, maxPop])
  //   .range([0, chartHeight - margin.bottom]);

  let yScale = d3.scaleLinear()
    .domain([skewDiff*minPop, maxPop])
    .range([chartHeight - margin.bottom, margin.top]);

  let xScale = d3.scaleBand()
    .domain(datedata)
    .range([margin.left, chartWidth-margin.right])
    .paddingInner([0.05]);

  //make the bars
  svgBarChart.selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("width", xScale.bandwidth())
    .attr("x", (d) => xScale(d[0]))
    .attr("height", function(d) {
      return chartHeight - margin.bottom - yScale(d[1])
    }) 
    .attr("y", function(d){
      return yScale(d[1])
    })
    .attr("fill", function(d){
      return `rgb(0, ${d[1]/maxPop*230}, 0)`
    });

    // make the axes
    let popFormat = function(num){
      return d3.format("~s")(num);
    }

    let yAxis = d3.axisLeft()
      .scale(yScale)
      .tickFormat(popFormat);

    svgBarChart.append("g")
      .attr("transform", `translate(${margin.left}, ${0})`)
      .call(yAxis);

    let dateFormat = function(num){
      let date = new Date(num);
      let options = { month: 'short'};
      let month = new Intl.DateTimeFormat('en-US', options).format(date);
      let year = date.getFullYear();
      return `${month} ${year}`;
    }

    let xAxis = d3.axisBottom()
      .scale(xScale)
      .tickFormat(dateFormat);

    svgBarChart.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(${0}, ${chartHeight-margin.bottom})`)
      .call(xAxis);

    //chart title
    svgBarChart.append("text")
      .text("Monthly Population Estimate")
      .attr("text-anchor", "middle")
      .attr("x", chartWidth/2)
      .attr("y", margin.top/2);

    adjustXAxisLabels(dataLength);

}

function adjustXAxisLabels(n){
  
  let d = (n <= 72) ? Math.ceil(n/12) : 12;

  let ticks = document.querySelector(".x-axis").querySelectorAll(".tick")

  for(let i = 0; i < n; i++){
    if(i % d != 0){
      ticks[i].innerHTML = "";
    }
  }
}

 

