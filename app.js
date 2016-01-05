var map, timeSlider;

require([
"esri/map", "esri/layers/FeatureLayer", "esri/TimeExtent", "esri/layers/TimeInfo",
"esri/renderers/ClassBreaksRenderer",
"esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol",
"esri/dijit/editing/TemplatePicker", "esri/dijit/TimeSlider",
"esri/renderers/TimeClassBreaksAger", "esri/renderers/TemporalRenderer",
"dojo/parser", "dojo/_base/array", "esri/Color", "dojo/dom", "dojo/date",
"esri/tasks/query","esri/tasks/QueryTask","esri/tasks/StatisticDefinition",

"dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dojo/domReady!"
], function(
Map, FeatureLayer, TimeExtent, TimeInfo,
ClassBreaksRenderer,
SimpleMarkerSymbol, SimpleLineSymbol,
TemplatePicker, TimeSlider,
TimeClassBreaksAger, TemporalRenderer,
parser, arrayUtils, Color, dom, date,
Query, QueryTask, StatisticDefinition
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


  map.addLayer(featureLayer);
  
	loadRanks();
	
	  
  //$("#timeBtn").on("click",featureLayerLoaded(featureLayer));   
  
}

function loadRanks(){
	
		//QUERY
	
	var qryTask = new QueryTask("http://services.arcgis.com/EgePHk52tsFjmhbJ/arcgis/rest/services/TESTTeamGuess/FeatureServer/0");
	
	var qry = new Query();
	qry.where = "OBJECTID > 0";
	qry.outFields = ["*"];

	
	qryTask.execute(qry, function(fs){
		
		//get list of Teams
		var teamList = [];
		
		
		for(var i = 0; i<fs.features.length; i++){
			
			var team = fs.features[i].attributes.TeamName;	

			teamList.push(team);

		}
		
		function onlyUnique(value, index, self) { 
			return self.indexOf(value) === index;
		}

		var teamFinal = teamList.filter( onlyUnique );
		
		var listOfObjects = [];
		
		
		teamFinal.forEach(function(entry) {
			
				var singleObj = {};
				singleObj['team'] = entry;
				singleObj['pts'] = 0;
				
				listOfObjects.push(singleObj);
				
		});
		
		

		for(var i = 0; i<fs.features.length; i++){
			
			var team = fs.features[i].attributes.TeamName;
			var point = fs.features[i].attributes.Points;

 			//for each team in the list of teams
			
			for(var k = 0; k<listOfObjects.length; k++){
				
				if (listOfObjects[k]["team"] == team){
								
					listOfObjects[k]["pts"] += point;
	
				}
				
			} 
			
		}
		
		var divtable = document.getElementById('rankTble');
		var rankTable='';
		
		listOfObjects.forEach(function(tm){
			
			var teamName = tm['team'];
			var totalPts = tm['pts'];
	
			
			//append to div
			rankTable += '<tr><td>'+teamName+'</td><td>'+totalPts+'</td></tr>';
			
			divtable.innerHTML = rankTable;
			
		});
		
		
		
	});
	
}

function featureLayerLoaded(evt) {
	
	console.log("loadddd");
  // creates time slider
  timeSlider = new TimeSlider({ style: "width: 100%;"}, dom.byId("timeSliderDiv"));
  timeSlider.setThumbCount(1);
  timeSlider.createTimeStopsByTimeInterval(evt.layer.getTimeDefinition(), 60, TimeInfo.UNIT_SECONDS);
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