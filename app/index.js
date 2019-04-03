'use strict';
import * as fs from "fs";
import * as messaging from "messaging";
import document from "document";
import clock from "clock";
import { battery } from "power";
import { goals } from "user-activity";
import { today } from "user-activity";
import { me as device } from "device";
import { locale } from "user-settings"; 
import { preferences } from "user-settings";

// Number of bars in the graph
const MAX_POINTS = 43;

// Maximum height of the graph
const MAX_HEIGHT = 45;

// Different display options
const GRAPHS = [['steps', 'Steps'],
              ['battery', 'Battery'], 
              ['distance', 'Distance'],
              ['calories', 'Calories'],
              ['activeMinutes', 'Activity'],
              ['elevationGain', 'Floors']];

// Days and months
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'Septembre', 'October', 'November', 'December'];

// Buffer of data points
let dataPoints = null;

// Display status
let displayStatus = null;

/*
 * Function to load the data points from disk
 */
function loadData() {
  try {
    dataPoints = fs.readFileSync("data_points.txt", "json");
  } catch (err) {
    // There was some kind of error, start with an empty array
    console.log(err);
    dataPoints = {
      'battery': [],
      'steps': [],
      'distance': [],
      'calories': [],
      'activeMinutes': [],
      'elevationGain': []
    };
  };
};

/*
 * Function to save the data to disk
 */
function saveData() {
  fs.writeFileSync("data_points.txt", dataPoints, "json");
};


function loadDisplayStatus() {
  try {
    displayStatus = fs.readFileSync("display_status.txt", "json");
  } catch (err) {
    // There was some kind of error, start with an empty array
    console.log(err);
    displayStatus = {
      'last_record': null,
      'display': 0,
      'spacing': 1000 * 60 * 30 // 30 minutes
    };
  };
};
function saveDisplayStatus() {
  fs.writeFileSync("display_status.txt", displayStatus, "json");
};

/*
 * Handle a click to change the display
 */
function changeGraph() {
  // Change the display status
  loadDisplayStatus();
  displayStatus.display = (displayStatus.display + 1) % GRAPHS.length;
  saveDisplayStatus();

  // Refresh the graph
  refreshGraph();
};

/* 
 * Refresh the graph, called when the clock face is refresh or
 * when the user switches what is being graphed
 */
function refreshGraph() {
  // Load the data if the face was restarted (dataPoints == null)
  if (dataPoints == null) {
    loadData();
  };
  
  // Load the display status if needed
  if (displayStatus == null) {
    loadDisplayStatus();
  };
  
  // get the target to display
  let target = GRAPHS[displayStatus.display][0];

  // update the label of the graph
  document.getElementById("graph-label").text = GRAPHS[displayStatus.display][1];

  // => find the max
  let max = dataPoints[target][0];
  for (let i in dataPoints[target]) {
    if (dataPoints[target][i] > max) {
      max = dataPoints[target][i];
    };
  };
  
  // avoid dividing by 0
  if (max == 0) {
    max = 1;
  };

  // Update the bars
  let elements = document.getElementsByClassName("graphbar");
  let index = 0;
  elements.forEach(function(element) {
    // Get the value
    let made = index < dataPoints[target].length ? dataPoints[target][index] : 0;
    index += 1;
    
    // Update the line (MAX_HEIGHT = goal reached)
    let goal = (target == "battery") ? 100 : (goals[target] || 1);
    let height = Math.floor((MAX_HEIGHT*Math.min(goal, made)) / (goal * 1.0));
    element.y = device.screen.height - 35 - height;
    element.height =  height;
  });  
};

/*
 * Function returning the date formatted
 */
function getDate(now) {
  // Get the info
  let lang = locale.language.substring(0,2);
  let day = ("0" + now.getDate()).slice(-2);
  let day_name = DAYS[now.getDay()];
  let month = ("0" + (now.getMonth() + 1)).slice(-2);
  let month_name = MONTHS[now.getMonth()];
  let year = "" + now.getFullYear();
  
  // Load the preferences
  loadDisplayStatus();
  
  // Format the string
  let text = "";
  switch ((displayStatus.format || 1)) {
    case 1: // MM/DD/YYYY
      text = month + "/" + day + "/" + year;
      break;
    case 2: // MM/DD/YY
      text = month + "/" + day + "/" + year.substring(2,4);
      break;
    case 3: // DD/MM/YYYY
      text = day + "/" + month + "/" + year;
      break;
    case 4: // DD/MM/YY
      text = day + "/" + month + "/" + year.substring(2,4);
      break;
    case 5: // Day DD Month
      text = day_name.substring(0,3) + " " + day + " " + month_name.substring(0,3);
      break;
    case 6: // Day, Month DD
      text = day_name.substring(0,3) + ", " + month_name.substring(0,3) + " " + day;
      break;
    case 7: // YYYY-MM-DD
      text = year + "/" + month + "/" + day;
      break;
  };
  
  return text;
};

/*
 * Function to refresh the clock face
 */
function refreshClockFace() {
  // Update the time
  let now = new Date();
  let hours = now.getHours();
  if (preferences.clockDisplay === "12h") {
        hours = (hours + 24) % 12 || 12;
    };
  let myClock = document.getElementById("myClock");
  myClock.text = hours + ":" + ("0" + now.getMinutes()).slice(-2);
  
  // Update activities
  let activities = ['steps', 'distance', 'calories', 'activeMinutes', 'elevationGain'];
  for (let i in activities) {
    // Get the activity
    let activity = activities[i];

    // Update the graph
    let goal = (goals[activity] || 1);
    let made = (today.local[activity] || 0);
    let radius = Math.floor((360*Math.min(goal, made)) / (goal * 1.0));
    document.getElementById("goal-" + activity).sweepAngle = radius;
  };
  
  // Update the date
  document.getElementById("date").text = getDate(now);
  
  // Refresh the graph
  refreshGraph();  
};

/*
 * Function to log a new set of data points
 */
function logData() {
  // Load the display status
  loadDisplayStatus();
  
  // See if we are about to record a new point
  let now = new Date();
  let roundedTime = (new Date(Math.round(now.getTime() / displayStatus.spacing) * displayStatus.spacing)).getTime();

  // If so, add the point and update the display
  if (roundedTime != displayStatus.last_record) {
    // Load the data
    loadData();
  
    // Update battery level
    let batteryLevel = Math.floor(battery.chargeLevel); // Math.floor(Math.random()*100.0);
    dataPoints.battery.push(batteryLevel);
    if (dataPoints.battery.length == MAX_POINTS) {
      dataPoints.battery.shift();
    };
    
    // Update activities
    let activities = ['steps', 'distance', 'calories', 'activeMinutes', 'elevationGain'];
    for (let i in activities) {
      let activity = activities[i];
      let made = (today.local[activity] || 0);
      dataPoints[activity].push(made);
      if (dataPoints[activity].length == MAX_POINTS) {
        dataPoints[activity].shift();
      };
    };
    
    // Save the data
    saveData();  
    
    // Update last record date
    displayStatus.last_record = roundedTime;
    
    // Save the display status
    saveDisplayStatus();    
  };
};

// Message is received
messaging.peerSocket.onmessage = evt => {
  console.log(`App received: ${JSON.stringify(evt)}`);
  if (evt.data.key === "spacing" && evt.data.newValue) {
    // Load the display status
    loadDisplayStatus();

    // Update the spacing 
    let spacing = eval(JSON.parse(evt.data.newValue).values[0].value);
    displayStatus.spacing = spacing;
    
    // Save the display status
    saveDisplayStatus();
    
    // Refresh
    refreshClockFace();
  };
  if (evt.data.key === "format" && evt.data.newValue) {
    // Load the display status
    loadDisplayStatus();

    // Update the spacing 
    let format = eval(JSON.parse(evt.data.newValue).values[0].value);
    displayStatus.format = format;
    
    // Save the display status
    saveDisplayStatus();
    
    // Refresh
    refreshClockFace();
  };
};

// Message socket opens
messaging.peerSocket.onopen = () => {
  console.log("App Socket Open");
};

// Message socket closes
messaging.peerSocket.onclose = () => {
  console.log("App Socket Closed");
};

// Refresh the clock face every minute when the display is on
clock.granularity = "minutes";
clock.ontick = () => refreshClockFace();

// Every minute, look if we need to log a new data point
setInterval(logData, 60000);

// Handle clicks on the graph
document.getElementById("graph").onclick = () => changeGraph();
