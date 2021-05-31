/* 

This code was created by Robert Kearney on : 2021-05-31

This code identifies the areas with the optimal climate and soil conditions for
growing Sweet Corn. Crop optimal suitability parameters are from the U.N. Food
and Agriculture Organization (FAO) EcoCrop database. The data analysed in this 
code includes PRISM 30-Year Climate Normals and SoilGrids Soil Ph. The suit-
ability constraints considered in this analysis include annual precipitation, 
mean temperature in the growing season months (May, June, July, August), minimun
temperature in April, and soil Ph. Finally suitability is is created by using 
the Fuzzy AND operator to find where all suitabiluity constraints are met.

*/

// Load Climate Data

var precip_band = ee.ImageCollection("OREGONSTATE/PRISM/Norm81m").select("ppt");
var tmin_band = ee.ImageCollection("OREGONSTATE/PRISM/Norm81m").select("tmin");
var tmean_band = ee.ImageCollection("OREGONSTATE/PRISM/Norm81m").select("tmean");

//Load Soil PH Data

var soil_band = ee.Image("projects/soilgrids-isric/phh2o_mean").select("phh2o_0-5cm_mean");


//Crop Parameters: Corn

var ktmp = 0
var corn_topmn = 16
var corn_topmx = 24
var ropmn = 800
var ropmx = 1500
var phopmn = 5.5
var phopmx = 6.8
var tkill = ktmp + 4

//Select Optimal Precipitation Suitability of Corn

var total_precip = precip_band.reduce(ee.Reducer.sum())
var op_precip_suit = total_precip.gte(ropmn).and(total_precip.lte(ropmx));

//Define Optimal Temperature Suitability Function

var op_temp_suit = function(image){
  return(image.gte(corn_topmn).and(image.lte(corn_topmx)))
}

//Define Survival Temperature Function
var kill_temp = function(image2){
  return(image2.gte(tkill))
}

//Map Optimal Temperature Suitabilty Function and Convert to a List
var monthly_op_temp_suit_12 = tmean_band.map(op_temp_suit)
var op_temp_suit_12_list = monthly_op_temp_suit_12.toList(monthly_op_temp_suit_12.size());

//Map Survival Temperature Function and Convert to a List
var monthly_kill_temp_12 = tmin_band.map(kill_temp)
var kill_temp_12_list = monthly_kill_temp_12.toList(monthly_kill_temp_12.size());

//Select Relevant Constraint Images and Store as Varianbles
var op_temp_suit_may = ee.Image(op_temp_suit_12_list.get(4))
var op_temp_suit_june = ee.Image(op_temp_suit_12_list.get(5))
var op_temp_suit_july = ee.Image(op_temp_suit_12_list.get(6))
var op_temp_suit_august = ee.Image(op_temp_suit_12_list.get(7))
var op_temp_suit_grow_season = op_temp_suit_june.and(op_temp_suit_july.and(op_temp_suit_august.and(op_temp_suit_may)))
var kill_temp_april = ee.Image(kill_temp_12_list.get(3))

//Divide Soil Ph Band by 10

var divide_soil_10 = soil_band.divide(10)

//Select Optimal Soil Ph
var op_ph_suit = divide_soil_10.gte(phopmn).and(divide_soil_10.lte(phopmx));

//Combined Suitability of Corn using Fuzzy AND Operator

var combined_suit = op_ph_suit.and(op_temp_suit_grow_season.and(op_precip_suit.and(kill_temp_april))).selfMask()

//Define Map Parameters
var visParams = {
  min:0,
  max:1,
  palette: ['white','green']
}

//Define Map Center and Display Map
Map.setCenter(-100.55, 40.71, 4);
Map.addLayer(combined_suit, visParams, 'Combined Suitability')

// Create a geometry representing an export region.
var geometry = ee.Geometry.Rectangle([-77, 39, -75, 41]);

// Export the image, specifying scale and region.
Export.image.toDrive({
  image: combined_suit,
  description: 'CornSuitabilityGEE',
  scale: 250,
  region: geometry,
  crs: 'EPSG:3857'
});
