var map, timeSlider;

require([
"esri/map", "esri/layers/FeatureLayer", "esri/TimeExtent", "esri/layers/TimeInfo",
"esri/renderers/ClassBreaksRenderer",
"esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol",
"esri/dijit/editing/TemplatePicker", "esri/dijit/TimeSlider",
"esri/renderers/TimeClassBreaksAger", "esri/renderers/TemporalRenderer",
"dojo/parser", "dojo/_base/array", "esri/Color", "dojo/dom", "dojo/date",
"esri/tasks/query","esri/tasks/QueryTask",

"dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dojo/domReady!"
], function(
Map, FeatureLayer, TimeExtent, TimeInfo,
ClassBreaksRenderer,
SimpleMarkerSymbol, SimpleLineSymbol,
TemplatePicker, TimeSlider,
TimeClassBreaksAger, TemporalRenderer,
parser, arrayUtils, Color, dom, date,
Query, QueryTask
) {
parser.parse();

map = new Map("map", {
  basemap: "streets",
  center: [-123.122, 49.28],
  slider: false,
  zoom:15
});
map.on("load", mapLoaded); 

function mapLoaded() {
  // feature layer
  ////add Team Guess layer
  var featureLayer = new FeatureLayer("http://services.arcgis.com/EgePHk52tsFjmhbJ/arcgis/rest/services/TESTTeamGuess/FeatureServer/0", {
	mode: FeatureLayer.MODE_SNAPSHOT,
	outFields: [ "*" ]
  });
  
  //get time range of data
  
  
  //set time range
  var timeExtent = new TimeExtent();
  timeExtent.endTime = new Date("1/4/2016T12:00:00");
  timeExtent.startTime = new Date("1/4/2016T12:31:00");
  

  featureLayer.setTimeDefinition(timeExtent);
  featureLayer.on("load", featureLayerLoaded);

 
  map.addLayer(featureLayer);
  
 
  
  
/*   //QUERY
var qry = new Query();
qry.outFields = ["TeamName","Points"];

var statDef = new StatisticDefinition();
statDef.statisticType = "sum";
statDef.onStatisticField = "Points"
qry.outStatistics = [statDef];
qry.groupByFieldsForStatistics["TeamName"];*/
  
}

function featureLayerLoaded(evt) {
  // creates time slider
  timeSlider = new TimeSlider({ style: "width: 100%;"}, dom.byId("timeSliderDiv"));
  timeSlider.setThumbCount(1);
  timeSlider.createTimeStopsByTimeInterval(evt.layer.getTimeDefinition(), 5, TimeInfo.UNIT_SECONDS);
  timeSlider.setThumbIndexes([0]);
  timeSlider.on("time-extent-change", displayTimeInfo);
  timeSlider.startup();
  map.setTimeSlider(timeSlider);
  timeSlider.play();
}

function displayTimeInfo(timeExtent) {
	//when thumb on timeslider is moved
  var info = timeExtent.startTime.toDateString() + 
	" &nbsp;&nbsp;<i>to<\/i>&nbsp;&nbsp; " + 
	timeExtent.endTime.toUTCString();
  dom.byId("timeInfo").innerHTML = info;
}
});