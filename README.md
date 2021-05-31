# Crop Suitability Modeling
This tutorial was created by Robert Kearney on : 2021-05-31

## Introduction
If you have ever though about moving out to the country and living an agrarian lifestyle, than this tutorial is for you! One of the most important things any propsective farmer has to determine is what to grow and where to grow it. In this tutorial, we will develop a mechanistic model to identify the areas with the optimal climate and soil conditions for growing sweet corn. By the end of the tutorial, you will learn how to use java and python to conduct a simple crop suitability analysis in Google Earth Engine (GEE) and ArcGIS Pro. 

## Optimal Conditions
For this analysis, only the optimal conditions for growing sweet corn are to be considered. The crop parameters came from the U.N. Food and Agriculture Organization (FAO) EcoCrop database. According to the FAO, the optimal monthly mean temperature for growing sweet corn is between 16 and 24 degrees celcius. Additionally, if the monthly minumum temperature is less than or equal to 4 degrees celcius, it is considered likely that the 0 degree celcius threshold (the temperature that will kill sweet corn) will be reached in that month. The optimal annual precipitation for growing sweet corn is between 800 and 1500 mm per year. Finally, the optimal soil Ph for growing sweet corn is between 5.5 and 6.8. 

## Data and Methods
The data included in this analysis includes [PRISM 30-Year Climate Normals](https://prism.oregonstate.edu/normals/)and [SoilGrids Soil Ph](https://soilgrids.org/). The suitability thresholds being considered in this analysis are annual precipitation, mean temperature in the growing season months (May, June, July, and August), minimum temprerature in April, and soil Ph. For this analysis, we are only considering minimum temperature in April because this is often when initial planting will occur. The combined suitability will be created by using the Fuzzy AND operator to select areas that meet all of the suitability thresholds.  

## Coding in GEE
GEE is a free and all you need to do is have google account and [sign-up](https://earthengine.google.com/new_signup/) for it. After you sign up, go to "[code.earthengine.google.com](https://code.earthengine.google.com/)" to access the code editor. The programing language used in GEE is Java. The pupose of this tutorial is not to teach you how to code in Java, but instead to show you some of the basic functionality of GEE and how to do a simple suitability analysis. 

### Loading the Data
The first step is to load the climate and soil data. This is where Google Earth Engine shines. There are petabytes of data hosted by Google and luckly for us, this includes the data from PRISM and SoilGrids. The datasets we are interested in are stored as seperate bands with unque names. The climate bands we are interested in are minimum temperature, mean temperature, and precipitation. It is important to note that the bands being selected are called "Image Collection" and have 12 images each. This is because each image represents the long-term average conditions for each month. For more information about the PRISM climate data, use the search bar to search for the dataset. The soil data was accessed from [here](https://git.wur.nl/isric/soilgrids/soilgrids.notebooks/-/blob/master/markdown/access_on_gee.md) and the image being selected is the soil Ph value at the surface (0-5cm). 

```Java
// Load Climate Data

var precip_band = ee.ImageCollection("OREGONSTATE/PRISM/Norm81m").select("ppt");
var tmin_band = ee.ImageCollection("OREGONSTATE/PRISM/Norm81m").select("tmin");
var tmean_band = ee.ImageCollection("OREGONSTATE/PRISM/Norm81m").select("tmean");

//Load Soil PH Data

var soil_band = ee.Image("projects/soilgrids-isric/phh2o_mean").select("phh2o_0-5cm_mean");

```

### Define the Optimal Crop Parameters 
Next, we define the crop parameters that we will use later on in the code. Notice that we could have just defined "tkill" as 4, but used addition to calculate the value instead. 

```Java
//Crop Parameters: Corn

var ktmp = 0
var corn_topmn = 16
var corn_topmx = 24
var ropmn = 800
var ropmx = 1500
var phopmn = 5.5
var phopmx = 6.8
var tkill = ktmp + 4

```

### Annual Precipitation Suitability
Now that we have loaded in the relevant data layers and defined our crop parameters, we are ready to start analyzing the data to identify areas that meet the the optimal suitability thresholds. We will start with annual precipitation. Since we are interested in annual precipitation and the data we have is monthly precipitation, we need to calculate the sum of all images. This is acheived through using a reducer and looks like this: ".reduce(ee.Reducer.sum())". Once we have our annual precipitation layer, all we need to do is identify all areas that are greater than or equal to the minimum threshold (800 mm) AND less than or equal to the maximum threshold (1500 mm). The result is a boolean image with values of 1 for areas that meet the suitability threshold and 0 for areas that do not. 

```Java
//Select Optimal Precipitation Suitability of Corn

var total_precip = precip_band.reduce(ee.Reducer.sum())
var op_precip_suit = total_precip.gte(ropmn).and(total_precip.lte(ropmx));

```

### Define Functions for Mean Temperature Suitability and Survivability
Next, we look at mean temperature and minimum temperature. Unlike with precipitation, we want monthly data for mean and minimun temperature. As such, we need to apply the same suitability thresholds to each month in the image collection. To do this, we define seperate functions for suitable mean temperatures and minimum temperatures. The "op_temp_suit" function will identify, for each monthly mean temperature image, the areas that meet the suitability threshold (Between 16 and 24 degrees celcius). The "kill_temp" function will identify, for each monthly minimum temperature image, the areas where corn will survive. 

```Java
//Define Optimal Temperature Suitability Function

var op_temp_suit = function(image){
  return(image.gte(corn_topmn).and(image.lte(corn_topmx)))
}

//Define Survival Temperature Function
var kill_temp = function(image2){
  return(image2.gte(tkill))
}


```

### Mapping the Functions and Converting Images to a List
With the functions defined, we can now map these functions to the relevant image collections and convert them to a list. This will be important for the next step.

```Java
//Map Optimal Temperature Suitabilty Function and Convert to a List
var monthly_op_temp_suit_12 = tmean_band.map(op_temp_suit)
var op_temp_suit_12_list = monthly_op_temp_suit_12.toList(monthly_op_temp_suit_12.size());

//Map Survival Temperature Function and Convert to a List
var monthly_kill_temp_12 = tmin_band.map(kill_temp)
var kill_temp_12_list = monthly_kill_temp_12.toList(monthly_kill_temp_12.size());
```
### Selecting the Relevant Temperature Suitability Images

The individual images that we are concerned about are the four images representing suitable mean temperatures in the growing season months (May, June, July, and August) and the one image reprenting survivable areas in April. This is acheived by using .get() to select the specific image from the list and storing it as an image object. Notice that the first image (January) is 0 and the 12th (December) is 11. 

```Java
//Select Relevant Constraint Images and Store as Varianbles
var op_temp_suit_may = ee.Image(op_temp_suit_12_list.get(4))
var op_temp_suit_june = ee.Image(op_temp_suit_12_list.get(5))
var op_temp_suit_july = ee.Image(op_temp_suit_12_list.get(6))
var op_temp_suit_august = ee.Image(op_temp_suit_12_list.get(7))
var op_temp_suit_grow_season = op_temp_suit_june.and(op_temp_suit_july.and(op_temp_suit_august.and(op_temp_suit_may)))
var kill_temp_april = ee.Image(kill_temp_12_list.get(3))
```

### Pre-process Soil Ph Image
The data product for soil Ph needs to be divided by 10 before we can assess suitability. This is done by using ".divide(10)".

```Java
//Divide Soil Ph Band by 10

var divide_soil_10 = soil_band.divide(10)
```

### Soil Ph Suitability
Once again soil suitability is determined in a similar fasion as the annual precipitation, with areas that meet the suitability range being idenitfied in a boolean image. 

```Java
//Select Optimal Soil Ph
var op_ph_suit = divide_soil_10.gte(phopmn).and(divide_soil_10.lte(phopmx));
```

### Combined Suitability
The combined suitability is determined by identifying areas where all suitability thresholds are met. This is done using the Fuzzy AND operator. The final image is also masked to only show suitable areas (pixels with a value of 1).

```Java
//Combined Suitability of Corn using Fuzzy AND Operator

var combined_suit = op_ph_suit.and(op_temp_suit_grow_season.and(op_precip_suit.and(kill_temp_april))).selfMask()
```

### Map the Combined Suitability
In order to see the combined suitability result, we need to define the visualization paramaters. It is improtant to not that although the color palette is from "white" to "green", the only colore we will see is green because the image has already been masked in the previous step. Finally, the image will be added to the map below. 

```Java
//Define Map Parameters
var visParams = {
  min:0,
  max:1,
  palette: ['white','green']
}

//Define Map Center and Display Map
Map.setCenter(-100.55, 40.71, 4);
Map.addLayer(combined_suit, visParams, 'Combined Suitability')

```

### Exporting Image to Google Drive
This part is not neccesary to include in your code, but will be used to compare the results from GEE to the results we will create using ArcGIS Pro. In this code, we need to define a region of the image that will be exported. This region will then be used when the export is generated. When you run the code with this section included, you will notice that a button will be added to the tasks tab. This will allow you to export the image to your Google Drive. It should take about a minute to export and you will be able to compare these results to the results we will create in ArcGIS Pro. 

```Java
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

```

## Coding in ArcGIS Pro
ArcGIS Pro is a GIS software platform that is installed on your local computer. A named user is required to utilze the software and it is not free. However, for those familiar with GIS, this is one of the most popular GIS software platform in the world. ArcGIS Pro utilizes the python programing language to do analysis and in this portion of the tutorial, I will show how we can conduct the same analysis in this programing language. This python scipt was generated using Model Builder and modified to allow anyone with access to ArcGIS pro to run the same analysis on their personal computer. For this tutorial, we will not go into detail about the script itself, but rather compare the GEE and ArcGIS Pro results. All the data has been downloaded from the same sources and clipped to an area around Lancaster, Pennsylvania. 

### Before we Begin...
Before we begin, download the "CornSuitabilityExercise.zip" file from the data folder in this repo and extract it to a file location on your computer. Also, download the "Corn_Suitability_Model.py" from this repo and open it the text editor of your choosing. 

### Updating the Folder Locations
With the python code open in your text editor, update the locations of the Results_Folder and Data_Folder that you extracted in the previous step. Ensure that you include two slashes and that it looks like the code below. 

```Python
    results_folder = "C:\\Users\\Rkear\\OneDrive\\Documents\\PythonForGIS\\final\\Results"
    data_folder = "C:\\Users\\Rkear\\OneDrive\\Documents\\PythonForGIS\\final\\testdata"
```

Feel free to take a look at the code and try to get a grasp of what is going on in it. Notice that for this analysis we are using the reclassify tool in ArcGIS to create our suitability images. Also, rather than calculating the annual precipitation, we are using the annual precipitation layer that came in the PRISM download. Besides using reclassify, the analysis is essentially the same. 

### Copy the Code into the Python Window in ArcGIS Pro and Run it
After you opening a project in ArcGIS Pro, in the Analysis tab, click the python drop-down and select "Python Window". The Python Window will appear at the bottom of the project. Copy the python code with your updated folder locations and paste it into the Python Window. Press "Enter" and the code will run. If no errors occur it worked!

### Viewing the Results
In the map tab, click add data and navigate to the "results_folder". Notice that all the individual suitability images and the "combined_op_suit" image are now in the folder. Add the combined_op_suit image and explore the results. 

## Compare the GEE and Python Results
When you add the image we created in GEE and downloaded from Google Drive, we can now easily compare the two images. To do so, click on one of the layers in the contents pane, clipc the appearance tab, and click swipe. You will notice that the mouse icon has changed and when you click on the map, you can compare the images that are currently on top of one another. At first glance, the images seem very similar, however as you zoom in, you can see that the pixels don't line up perfectly. This is probably due to the different  coordinate systems of the images. I intend to tweak the code to create more consistant results, but for this analysis, I would say that the results are pretty consistent and good enough for this application. I hope that you enjoyed this tutorial and feel free modify the code for other crop species or geographies. Happy Coding!
