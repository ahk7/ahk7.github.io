var map, timeSlider;

require([
"esri/map", "esri/layers/FeatureLayer", "esri/TimeExtent", "esri/layers/TimeInfo",
"esri/renderers/ClassBreaksRenderer",
"esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol",
"esri/dijit/editing/TemplatePicker", "esri/dijit/TimeSlider",
"esri/renderers/TimeClassBreaksAger", "esri/renderers/TemporalRenderer",
"dojo/parser", "dojo/_base/array", "esri/Color", "dojo/dom", "dojo/date",
"esri/tasks/query","esri/tasks/QueryTask","esri/tasks/StatisticDefinition",
"esri/tasks/BufferParameters", "esri/tasks/geometry",
"esri/tasks/DistanceParameters",
"esri/graphic", "esri/layers/GraphicsLayer","esri/tasks/FeatureSet",
"esri/tasks/GeometryService",
"esri/dijit/InfoWindow",
"esri/request",
"esri/renderers/HeatmapRenderer",
"esri/renderers/UniqueValueRenderer",
"esri/symbols/SimpleMarkerSymbol","esri/symbols/SimpleLineSymbol",
"dojo/DeferredList","dojo/_base/Deferred",
"dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dojo/domReady!"
], function(
Map, FeatureLayer, TimeExtent, TimeInfo,
ClassBreaksRenderer,
SimpleMarkerSymbol, SimpleLineSymbol,
TemplatePicker, TimeSlider,
TimeClassBreaksAger, TemporalRenderer,
parser, arrayUtils, Color, dom, date,
Query, QueryTask, StatisticDefinition,
BufferParameters, Geometry,
DistanceParameters,
Graphic, GraphicsLayer, FeatureSet,
GeometryService,
InfoWindow,
esriRequest,
HeatmapRenderer,
UniqueValueRenderer,
SimpleMarkerSymbol, SimpleLineSymbol,
DeferredList, Deferred
) {
parser.parse();

$('#splashscreen').hide();

map = new Map("map", {
  basemap: "streets",
  center: [-123.122, 49.285],
  slider: false,
  zoom:15

});

var gsvc = new GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

// feature layer
////add Team Guess layer
var featureLayer = new FeatureLayer("http://services.arcgis.com/EgePHk52tsFjmhbJ/arcgis/rest/services/Team_Submissions/FeatureServer/0", {
mode: FeatureLayer.MODE_SNAPSHOT,
outFields: [ "*" ]
});


var answerLayer = new FeatureLayer("http://services.arcgis.com/EgePHk52tsFjmhbJ/arcgis/rest/services/Answers/FeatureServer/0", {
	mode: FeatureLayer.MODE_SNAPSHOT,
	opacity: 0.0,
	outFields: [ "*" ]
});



map.on("load", mapLoaded); 

//add teamname
var Teams = [];

function mapLoaded() {
	var today = new Date();
	var timeExtent = new TimeExtent();
	timeExtent.startTime = new Date("1/4/2016 12:00:00 UTC");
	timeExtent.endTime = new Date("1/4/2016 12:31:00 UTC");
	featureLayer.setTimeDefinition(timeExtent);
	

	renderByTeam(today, timeExtent.endTime);	
	
	
	map.addLayers([featureLayer, answerLayer]);	
	
	
	loadRanks();
	
	//add renderers
	
	
	
	
	featureLayer.on("click", function(evt){
	
		if(today>timeExtent.endTime){
			
			var attr = evt.graphic.attributes;
			console.log("you clicked here");
			
			if(attr.TeamName){
				
				$("#teamName").text(attr.TeamName);
				
				if(attr.Guess){
					
					$("#Guess").text(attr.Guess);
				}
				
				
			}
			
			var objectId = evt.graphic.attributes[featureLayer.objectIdField];
			
			featureLayer.queryAttachmentInfos(objectId, function(infos){
				 
				if (infos.length>0 && !!infos[0].url) {
					$("#imgAttach").attr("src", "");
					$("#imgAttach").attr("src", infos[0].url);
				}
				else{
					console.log("oops");
					$("#imgAttach").attr("src", "None2.png");
				}
			});
		}
	else{

		//add splash screen
		$('#splashscreen').show();
		$('#splashscreen').fadeOut(1500);

	}		
		

	});
	
	
	
	map.on("layers-add-result", function(evt){
		
		
		photoCheck(evt);
		
	});

	featureLayer.on("load", featureLayerLoaded);
	

}

function renderByTeam(today, raceEnd){
	console.log("here");
	
	if(today>raceEnd){
		console.log('beg');
		var defaultSymbol = "";
		var renderer = new UniqueValueRenderer(defaultSymbol, "TeamName");
		console.log('2');
		renderer.addValue("TeamA", new SimpleMarkerSymbol().setColor(new Color([255,255,0,0.5]))); 
		renderer.addValue("TeamB", new SimpleMarkerSymbol().setColor(new Color([128,0,128,0.5]))); 
		
		console.log(renderer);
		featureLayer.setRenderer(renderer);
	}
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
		//var dateList = [];
		//console.log(fs.features);
		
		for(var i = 0; i<fs.features.length; i++){
			
			var team = fs.features[i].attributes.TeamName;	
				
			//var date = fs.features[i].attributes.CreateDate;
			
			
			//var ddd = new Date(date);
			
			
			//dateList.push(date);
				
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
		
		//dateList.sort();

		

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
	//set time range

	
	map.setExtent(featureLayer.fullExtent);
	map.setZoom(14);

	// creates time slider
	timeSlider = new TimeSlider({ style: "width: 100%;"}, dom.byId("timeSliderDiv"));
	
	//timeSlider.thumbCount = 2;
	timeSlider.createTimeStopsByTimeInterval(evt.layer.getTimeDefinition(),5, TimeInfo.UNIT_MINUTES);
	timeSlider.setThumbIndexes([7]);
	timeSlider.setThumbMovingRate(750);

	timeLabels(timeSlider);
	
	timeSlider.startup();
	map.setTimeSlider(timeSlider);
	
	timeSlider.on("time-extent-change", function(evt){
		
		
	
		
		var timeExt = evt.target.fullTimeExtent;
		var end = map.timeExtent.endTime;
	
		
		//when thumb on timeslider is moved
		 var info = timeExt.startTime.toUTCString() + 
		" &nbsp;&nbsp;<i>to<\/i>&nbsp;&nbsp; " + 
		end.toUTCString();
		
		dom.byId("timeInfo").innerHTML = info;
		
		
	});


	
}

function timeLabels(ts){
	
	var labels = Array.map(ts.timeStops, function(timeStop,i){ 
    if(i>= 0){
      return timeStop.getMinutes(); }
    else{
      return "";
    }
  });   
  

  timeSlider.setLabels(labels);

}



function photoCheck(evt){

	 	fLayer = evt.layers[0].layer;
		answerLyr = evt.layers[1].layer;
		
		var qLayer = new GraphicsLayer();
		var aLayer = new GraphicsLayer();
		
		runQry(fLayer, fLayer.url, qLayer);
		runQry(answerLyr, answerLyr.url, aLayer);
		
		function runQry(lyr, url, mainLyr){
		
			var qryTaskQ = new QueryTask(lyr.url);
	
			var qryQ = new Query();
			qryQ.where = "1=1";
			qryQ.outFields = ["*"];
			qryQ.returnGeometry =true;
			qryQ.outSpatialReference = map.spatialReference;
			
			qryTaskQ.execute(qryQ, function(fs){
						
				for(var i=0;i<fs.features.length;i++){
					
					mainLyr.add(fs.features[i]);
					
				}
				
				map.addLayer(mainLyr);
				
			
			});
			
		}
		
		
		map.on("layer-add", function(evt){

			var graphics = aLayer.graphics;
			var answerPts = qLayer.graphics;
			var deductPts = [];
	
			//for each answer
			for(var i=0;i<answerPts.length;i++){
				 
				var ans = answerPts[i];
				
				var answerID = ans.attributes.OBJECTID;
				
				for(var j=0;j<graphics.length;j++){
					
					var ques = graphics[j];
					var questionID = ques.attributes.Question;
					var questionTeam = ques.attributes.TeamName;
					
					var params = hello(answerPts[i].geometry, graphics[j].geometry);
				
					

					 if(answerID == questionID){
						
						geo(params,answerPts[i], graphics[j]);
						}

					 }

			}
				


		});

		

		
		
		//for each question, get photo and add into div
		//div has 2 buttons, buttons if pressed stay down, also has close button
		//if wrong photo, deduct from points
		

	
	
}

function geo(pp, aa, qq){
	
	gsvc.distance(pp, function(dist){
		
		
		 if(dist>75){
			
			
			for(var k =0;k<featureLayer.graphics.length;k++){
				
				var fl = featureLayer.graphics[k].attributes;
				
				//if not already updated for that question submission, calc points
		/* 		if(fl.Updated_Geo == "N"){
					
					
				} */
				
				if(fl.Question == qq.attributes.Question && fl.TeamName == qq.attributes.TeamName){
					
					//fl.Points -= 500;
					//fl.Updated_Geo = "Y";
					
					//fLayer.applyEdits(null,[fLayer.graphics[k]],null);
					
					
				}
				
			}
			
			
		}
		else{
			
		} 
			
			
	 });
	 
	 

}
function hello(aa, qq){
						
						var p =new DistanceParameters();
						
						  p.geometry1 = aa;
						
						  p.geometry2= qq;
						  //define spatialRef
						 p.distanceUnit = gsvc.UNIT_METER;
						 
						 return p;
					}
});