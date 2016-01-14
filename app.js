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
"esri/tasks/GeometryService","esri/SpatialReference",
"esri/dijit/InfoWindow",
"esri/request",
"esri/renderers/HeatmapRenderer",
"esri/renderers/UniqueValueRenderer",
"esri/symbols/SimpleFillSymbol","esri/symbols/SimpleMarkerSymbol","esri/symbols/SimpleLineSymbol",
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
GeometryService, SpatialReference,
InfoWindow,
esriRequest,
HeatmapRenderer,
UniqueValueRenderer,
SimpleFillSymbol,SimpleMarkerSymbol, SimpleLineSymbol,
DeferredList, Deferred
) {
parser.parse();

//hide message that says race is still on-going
$('#raceOn').hide();

/* VARIABLES TO EDIT */

//create map
map = new Map("map", {
  basemap: "streets",
  center: [-123.122, 49.285],
  slider: false,
  zoom:15

});

//create geometry service
var gsvc = new GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

//add Team Guesses layer
var featureLayer = new FeatureLayer("http://services.arcgis.com/EgePHk52tsFjmhbJ/arcgis/rest/services/TeamSubmissions/FeatureServer/0", {
mode: FeatureLayer.MODE_SNAPSHOT,
outFields: [ "*" ]
});

//add Answers layer
var answerLayer = new FeatureLayer("http://services.arcgis.com/EgePHk52tsFjmhbJ/arcgis/rest/services/Answer_WGS/FeatureServer/0", {
mode: FeatureLayer.MODE_SNAPSHOT,
outFields: [ "*" ]
});

//assign team names
//provide the name of the Team, and the AGOL username that will be collecting points on behalf of the team
var Teams =[];
Teams["TeamA"] = "akung_support";
Teams["TeamB"] = "other_support";
	
//add timeframe of race ("mm/dd/yyy HH:MM:SS UTC")
var raceStart = new Date("1/4/2016 12:00:00 UTC");
var raceEnd = new Date("1/24/2016 12:31:00 UTC");


map.on("load", mapLoaded); 

$('#printBtn').click(getClues);


$('#showAnswers').hide();



//run when map is loaded
function mapLoaded() {
	
	//today's date
	var today = new Date();

	//set the time frame of the race
	var timeExtent = new TimeExtent();
	timeExtent.startTime = raceStart;
	timeExtent.endTime = raceEnd;
	featureLayer.setTimeDefinition(timeExtent);

	
	if (today>raceEnd){
		
			$('#showAnswers').show();
			
	}


$('#showAnswers').on("click",
			
			function(){
				var he =$(this).val();
				if(he == "Get Answers"){
				
					$(this).attr('value', 'Hide Answers');
					console.log("getting");
					doBuffer(answerLayer, gsvc);
					
				}
				else if(he == "Hide Answers"){
				console.log("not getting");
					$(this).attr('value', 'Get Answers');
					
					map.graphics.clear();
					answerLayer.setVisibility(0);
					
				}

	});
	//when race is over, colour the points by team
	renderByTeam(today, timeExtent.endTime);	
	
	//add layers to map
	map.addLayers([featureLayer, answerLayer]);	

	answerLayer.setVisibility(0);
	
	//load current rankings
	loadRanks();

	featureLayer.on("click",function(evt){
			
		featDetails(evt, today, timeExtent.endTime);
	});

	featureLayer.on("load", function(evt){
		
		featureLayerLoaded(evt);

		
	});
	
	map.on("layers-add-result", function(evt){
		
		//photoCheck(evt);
	
	});
	


}


function doBuffer(answerLayer, gsvc) {
	 console.log("run");
	answerLayer.setVisibility(1);
	var qryTask1 = new QueryTask(answerLayer.url);
	
	var qry1 = new Query();
	qry1.where = "1=1";
	qry1.outFields = ["*"];
	qry1.returnGeometry = true;
	
	answerLayer.selectFeatures(qry1, FeatureLayer.SELECTION_NEW, function(fs){
	
	map.graphics.clear();
	

	for(var i=0;i<fs.length;i++){
		
		var graph = fs[i].geometry;
		var params = new BufferParameters();
	 
	params.geometries = [ graph ];
 //buffer in linear units such as meters, km, miles etc.
      params.distances = [ 75];
      params.unit = gsvc.UNIT_METER;
	 // params.bufferSpatialReference = new SpatialReference({wid:102100});
	  //console.log(graph.geometry.spatialReference);

      params.outSpatialReference = graph.spatialReference;

      gsvc.buffer(params, showBuffer, function(){console.log("this is an err");});
	}


	});
	
	

	
 
}

function showBuffer(geometries) {
	console.log("showing buff");
     var symbol = new SimpleFillSymbol(
		SimpleFillSymbol.STYLE_SOLID,
		new SimpleLineSymbol(
		  SimpleLineSymbol.STYLE_SOLID,
		  new Color([0,0,255,0.65]), 2
		),
		new Color([0,0,255,0.35])
	  );

  dojo.forEach(geometries, function(geometry) {
	var graphic = new Graphic(geometry,symbol);
	map.graphics.add(graphic);
  });
}



function featDetails(evt, today, raceEnd){
		
		//if race is over
		
	
		
	if(today>raceEnd){
		
		var attr = evt.graphic.attributes;
		
		//if a team name exists, show the team's name and their guess
		 if(attr.TeamName){
			
			$("#teamName").text(attr.TeamName);
			
			if(attr.Guess){
				
				$("#Guess").text(attr.Guess);
			}
			
			
		} 
		
		//Get attached photos
		var objectId = evt.graphic.attributes[featureLayer.objectIdField];
		
		featureLayer.queryAttachmentInfos(objectId, function(infos){
			 
			 //if there are attachments
			if (infos.length>0 && !!infos[0].url) {
				//show them in the div
				$("#imgAttach").attr("src", "");
				$("#imgAttach").attr("src", infos[0].url);
			}
			else{
				//otherwise show no attachments found
				$("#imgAttach").attr("src", "None2.png");
			}
		});
	}
	else{
		//add splash screen
		$('#raceOn').show();
		$('#raceOn').fadeOut(1500);
	}

}

//print Clues to PDF
function printClues(clues) {

	var pdf = new jsPDF();

	pdf.fromHTML(clues);
	pdf.save('Clues.pdf');
}

function getClues(){
	
	var qryTask = new QueryTask(answerLayer.url);
	
	var qry = new Query();
	qry.where = "1=1";
	qry.outFields = ["Clue1","Question"];
	
	var clueList = '<h1> Clues </h1>';
	
	qryTask.execute(qry, function(fs){
		
		for(var i=0;i<fs.features.length;i++){
			clueList += '<p>'+fs.features[i].attributes.Question;
			clueList += '\. '+fs.features[i].attributes.Clue1+'</p>';
		}
		
		printClues(clueList);
		
	});
}

//colour by team when race is over
function renderByTeam(today, raceEnd){
	
	//if race is over
	if(today>raceEnd){

		var defaultSymbol = "";
		var renderer = new UniqueValueRenderer(defaultSymbol, "TeamName");
		
		//colour by team name
		renderer.addValue("TeamA", new SimpleMarkerSymbol().setColor(new Color([255,255,0,0.5]))); 
		renderer.addValue("TeamB", new SimpleMarkerSymbol().setColor(new Color([128,0,128,0.5]))); 
		
		//set renderer
		featureLayer.setRenderer(renderer);
	}
}

//load team ranking
function loadRanks(){
	
	//var qryTask = new QueryTask("http://services.arcgis.com/EgePHk52tsFjmhbJ/arcgis/rest/services/TESTTeamGuess/FeatureServer/0");
	var qryTask1 = new QueryTask(featureLayer.url);
	
	var qry1 = new Query();
	qry1.where = "OBJECTID > 0";
	qry1.outFields = ["*"];
	
	qryTask1.execute(qry1, function(fs){
		
		var obj =Object.keys(Teams);
		
		var listOfObjects = [];
		
		for(var i=0;i<obj.length;i++){
			var singleObj = {};

			singleObj['team'] = obj[i];
			singleObj['pts'] = 0;

			listOfObjects.push(singleObj);
			
		}

		
		for(var i = 0; i<fs.features.length; i++){
			
			var team = fs.features[i].attributes.TeamName;
			var point = fs.features[i].attributes.Points;
			
			//var now = new Date(fs.features[i].attributes.DT);
			
			//console.log(now);

 			//for each team in the list of teams
			
			for(var k = 0; k<listOfObjects.length; k++){
				
				if (listOfObjects[k]["team"] == team){
								
					listOfObjects[k]["pts"] += point;
	
				}
				
			} 
			
		}

		
		var divtable = $('#rankTble');
		var rankTable='';
		
		listOfObjects.forEach(function(tm){
			
			var teamName = tm['team'];
			var totalPts = tm['pts'];
	
			//append to div
			rankTable += '<tr><td>'+teamName+'</td><td>'+totalPts+'</td></tr>';

		});
		divtable.append(rankTable);
		
	});
	
}

//timeSlider
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
		
		//add graphic layer to calculate distance
	 	fLayer = evt.layers[0].layer;
		answerLyr = evt.layers[1].layer;
		
		var qLayer = new GraphicsLayer();
		var aLayer = new GraphicsLayer();
		
		runQry(fLayer, fLayer.url, qLayer);
		runQry(answerLyr, answerLyr.url, aLayer);
		
		//add graphic layers together to use both
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
		
		//when layer is added
		map.on("layer-add", function(evt){

			var graphics = aLayer.graphics;
			var answerPts = qLayer.graphics;
			var deductPts = [];
	
			//for each answer
			for(var i=0;i<answerPts.length;i++){
				 
				var ans = answerPts[i];
				
				var answerID = ans.attributes.Question;
				
				for(var j=0;j<graphics.length;j++){
					
					var ques = graphics[j];
					var questionID = ques.attributes.Question;
					var questionTeam = ques.attributes.TeamName;
					
					var params = getParams(answerPts[i].geometry, graphics[j].geometry);
				
					 if(answerID == questionID){
						
						//update points based on distance
						getPoints(params,answerPts[i], graphics[j]);
					
						}

					 }

			}
				


		});


}

function getPoints(pp, aa, qq){

	
	gsvc.distance(pp, function(dist){

		for(var k =0;k<featureLayer.graphics.length;k++){
			
			var fl = featureLayer.graphics[k].attributes;
			
			//assign team names
			if(fl.TeamName.length<1 || !fl.TeamName){
				
				//for each team name, check if the AGOL username == team name
				
				for(var tm in Teams){
				
					var agolName = Teams[tm];
					var tmName = tm;
					
					if(agolName == fl.Editor){

						fl.TeamName = tmName;
					}
				}
				
			}

			//if too far
			if(dist>75){
				
				//get feature from from editable layer	
				if(fl.Question == qq.attributes.Question && fl.TeamName == qq.attributes.TeamName){
					console.log(fl.TeamName + fl.Question +"is too far");
				
					//if points have not been updated yet (based on geom)
					
					var pt = 0;

					var up_geom = 'N';
					var up_pic = 'N';
				
					//if points haven't been updated
					if(fl.Update_Pt == "N" && fl.Update_Photo == "N"){
						console.log(fl.TeamName + fl.Question +"has not been updated");
						if(fl.Photo_Correct == "N"){
							console.log("photo is wrong");
							pt += 0;
							up_geom = "Y";
							up_pic = "Y";
						}
						else if(fl.Photo_Correct == "Y"){
							console.log("photo is correct");
							pt += 500;
							up_geom = "Y";
							up_pic = "Y";
						}
						else{
							console.log("photo TBA");
							pt += 0;
							up_geom = "Y";
		
						}
						
						fl.Points += pt;
						fl.Update_Pt = up_geom;
						fl.Update_Photo = up_pic;
						
													
						featureLayer.applyEdits(null,[featureLayer.graphics[k]],null);
					}
					else if(fl.Update_Pt == "Y" && fl.Update_Photo == "N"){
						console.log(fl.TeamName + fl.Question +" has only updated the point, check pic");
						
						if(fl.Photo_Correct == "N"){
								console.log("photo is wrong");
							pt += 0;
							up_geom = "Y";
							up_pic = "Y";
						}
						else if(fl.Photo_Correct == "Y"){
								console.log("photo is correct");
							pt += 500;
							up_geom = "Y";
							up_pic = "Y";
						}
						else{
							console.log("photo TBA");
							pt += 0;
							up_geom = "Y";
		
						}
						
						fl.Points += pt;
						fl.Update_Pt = up_geom;
						fl.Update_Photo = up_pic;
						
													
						featureLayer.applyEdits(null,[featureLayer.graphics[k]],null);
						
					}
					else if(fl.Update_Pt == "N" && fl.Update_Photo == "Y"){
						
						
						console.log("photo can't be updated with point being updated");
						
					}


				}


			}
			
			else if(dist<=75){
				
				//get feature from from editable layer	
				if(fl.Question == qq.attributes.Question && fl.TeamName == qq.attributes.TeamName){
					console.log(fl.TeamName + fl.Question +"is close");
				
					//if points have not been updated yet (based on geom)
					
					var pt = 0;
					var up_geom = 'N';
					var up_pic = 'N';
				
					//if points haven't been updated
					if(fl.Update_Pt == "N" && fl.Update_Photo == "N"){
						console.log(fl.TeamName + fl.Question +"has not been updated");
						if(fl.Photo_Correct == "N"){
							console.log("photo wrong");
							pt += 500;
							up_geom = "Y";
							up_pic = "Y";
						}
						else if(fl.Photo_Correct == "Y"){
							console.log("photo correct");
							pt += 1000;
							up_geom = "Y";
							up_pic = "Y";
						}
						else{
							console.log("photo TBA");
							pt += 500;
							up_geom = "Y";
		
						}
						
						fl.Points += pt;
						fl.Update_Pt = up_geom;
						fl.Update_Photo = up_pic;
						
													
						featureLayer.applyEdits(null,[featureLayer.graphics[k]],null);
					}
					else if(fl.Update_Pt == "Y" && fl.Update_Photo == "N"){
						console.log(fl.TeamName + fl.Question +" has only updated the point, check pic");
						console.log("Photo is: "+fl.Photo_Correct);
						
						if(fl.Photo_Correct == "N"){
							console.log("wrong");
							pt += 0;
							up_geom = "Y";
							up_pic = "Y";
						}
						else if(fl.Photo_Correct == "Y"){
							console.log("correct");
							pt += 500;
							up_geom = "Y";
							up_pic = "Y";
						}
						else{
							console.log("photo TBA");
							pt += 0;
							up_geom = "Y";
		
						}
						
						fl.Points += pt;
						fl.Update_Pt = up_geom;
						fl.Update_Photo = up_pic;
						
													
						featureLayer.applyEdits(null,[featureLayer.graphics[k]],null);
						
					}
					else if(fl.Update_Pt == "N" && fl.Update_Photo == "Y"){

						console.log("photo if point hasn't been updated");
						
					}


				}


			}


		}
	});

}
function getParams(aa, qq){
						
	var p =new DistanceParameters();
		
	p.geometry1 = aa;

	p.geometry2= qq;
	//define spatialRef
	p.distanceUnit = gsvc.UNIT_METER;

	return p;
	}
	
});