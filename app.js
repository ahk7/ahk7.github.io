var map, timeSlider;

require([
"esri/map", "esri/layers/FeatureLayer", "esri/TimeExtent", "esri/layers/TimeInfo",
"esri/renderers/ClassBreaksRenderer",
"esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol",
"esri/dijit/editing/TemplatePicker", "esri/dijit/TimeSlider",
"esri/renderers/TimeClassBreaksAger", "esri/renderers/TemporalRenderer",
"dojo/parser", "dojo/_base/array", "esri/Color", "dojo/dom", "dojo/date",

"dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dojo/domReady!"
], function(
Map, FeatureLayer, TimeExtent, TimeInfo,
ClassBreaksRenderer,
SimpleMarkerSymbol, SimpleLineSymbol,
TemplatePicker, TimeSlider,
TimeClassBreaksAger, TemporalRenderer,
parser, arrayUtils, Color, dom, date
) {
parser.parse();

map = new Map("map", {
  basemap: "streets",
  center: [-98, 37.2],
  slider: false,
  zoom:9
});
map.on("load", mapLoaded);   

function mapLoaded() {
  // feature layer
  var featureLayer = new FeatureLayer("https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/ks_earthquakes_since_2000/FeatureServer/0", {
	mode: FeatureLayer.MODE_SNAPSHOT,
	outFields: [ "*" ]
  });
  var timeExtent = new TimeExtent();
  timeExtent.endTime = new Date("11/1/2015");
  timeExtent.startTime = new Date("11/1/2014");
  
  featureLayer.setDefinitionExpression("mag > 2");
  featureLayer.setTimeDefinition(timeExtent);
  featureLayer.on("load", featureLayerLoaded);

  // temporal renderer
  var observationRenderer = new ClassBreaksRenderer(new SimpleMarkerSymbol(), "mag");
  observationRenderer.addBreak(7, 12, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 24, new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([100,100,100])),new Color([0,0,0,0])));

  observationRenderer.addBreak(6, 7, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 21, new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([100,100,100])),new Color([0,0,0,0])));

  observationRenderer.addBreak(5, 6, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 18,new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([100,100,100])),new Color([0,0,0,0])));

  observationRenderer.addBreak(4, 5, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 15,new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([100,100,100])),new Color([0,0,0,0])));

  observationRenderer.addBreak(3, 4, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 12,new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([100,100,100])),new Color([0,0,0,0])));

  observationRenderer.addBreak(2, 3, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 9,new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([100,100,100])),new Color([0,0,0,0])));

  observationRenderer.addBreak(0, 2, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 6,new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([100,100,100])),new Color([0,0,0,0])));

  
  //build a legend for the temporal renderer using the template picker
  var symbols = arrayUtils.map(observationRenderer.infos,function(info){
	return  {label: info.minValue + " - " + info.maxValue,symbol:info.symbol};
  });
  symbols.reverse(); //flip the array so the lowest magnitude symbol displays on top

  var infos = [
	{ minAge: 48, maxAge: Infinity, color: new dojo.Color([255,0,0])},
	{ minAge: 24, maxAge: 48, color: new dojo.Color([49,154,255])},
	{ minAge: 0, maxAge: 24, color: new dojo.Color([255,255,8])}
  ];
 
  var ageSymbols = [];
  ageSymbols.push({label: "Less than 1 month",symbol: new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([255,0,0])).setWidth(10)});
  ageSymbols.push({label: "1 - 6 months",symbol: new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([49,154,255])).setWidth(10)});
  ageSymbols.push({label: "6+ months",symbol: new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([255,255,8])).setWidth(10)});

  var legend = new TemplatePicker({
	items : symbols,
	rows: 7,
	columns: 1
  }, "magnitudeDiv");
  legend.startup();     

  var legend2 = new TemplatePicker({
	items : ageSymbols,
	rows: 3,
	columns: 1
  }, "ageDiv");
  legend2.startup();   
  
  var ager = new TimeClassBreaksAger(infos, TimeClassBreaksAger.UNIT_WEEKS);
  var renderer = new TemporalRenderer(observationRenderer, null, null, ager);
  featureLayer.setRenderer(renderer);

  map.addLayer(featureLayer);
  
  //resize the map when the browser resizes
  // registry.byId("map").on("resize", map.resize);
}

function featureLayerLoaded(evt) {
  // create time slider
  timeSlider = new TimeSlider({ style: "width: 100%;"}, dom.byId("timeSliderDiv"));
  timeSlider.setThumbCount(1);
  timeSlider.createTimeStopsByTimeInterval(evt.layer.getTimeDefinition(), 1, TimeInfo.UNIT_WEEKS);
  timeSlider.setThumbIndexes([0]);
  timeSlider.on("time-extent-change", displayTimeInfo);
  timeSlider.startup();
  map.setTimeSlider(timeSlider);
  timeSlider.play();
}

function displayTimeInfo(timeExtent) {
  var info = timeExtent.startTime.toDateString() + 
	" &nbsp;&nbsp;<i>to<\/i>&nbsp;&nbsp; " + 
	timeExtent.endTime.toUTCString();
  dom.byId("timeInfo").innerHTML = info;
}
});