# Crop Suitability Modeling
This tutorial was created by Robert Kearney on : 2021-05-31

## Introduction
If you have ever though about moving out to the country and living an agrarian lifestyle, than this tutorial is for you! One of the most important things any propsective farmer has to determine is what to grow and where to grow it. In this tutorial, we will develop a mechanistic model to identify the areas with the optimal climate and soil conditions for growing sweet corn. By the end of the tutorial, you will learn how to use java and python to conduct a simple crop suitability analysis in Google Earth Engine (GEE) and ArcGIS Pro. 

## Optimal Conditions
For this analysis, only the optimal conditions for growing sweet corn are to be considered. The crop parameters came from the U.N. Food and Agriculture Organization (FAO) EcoCrop database. According to the FAO, the optimal monthly mean temperature for growing sweet corn is between 16 and 24 degrees celcius. Additionally, if the monthly minumum temperature is less than or equal to 4 degrees celcius, it is considered likely that the 0 degree celcius threshold (the temperature that will kill sweet corn) will be reached in that month. The optimal annual precipitation for growing sweet corn is between 800 and 1500 mm per year. Finally, the optimal soil Ph for growing sweet corn is between 5.5 and 6.8. 

## Data and Methods
The data included in this analysis includes [PRISM 30-Year Climate Normals](https://prism.oregonstate.edu/normals/)and [SoilGrids Soil Ph](https://soilgrids.org/). The suitability thresholds being considered in this analysis are annual precipitation, mean temperature in the growing season months (May, June, July, and August), minimum temprerature in April, and soil Ph. The combined suitability will be created by using the Fuzzy AND operator to select areas that meet all of the suitability thresholds.  

## Coding in GEE
GEE is a free and all you need to do is have google account and [sign-up](https://earthengine.google.com/new_signup/) for it. After you sign up, go to "[code.earthengine.google.com](https://code.earthengine.google.com/)" to access the code editor. The programing language used in GEE is Java. The pupose of this tutorial is not to teach you how to code in Java, but instead to show you some of the basic functionality of GEE and how to do a simple suitability analysis. 

### Loading the Data
The first step is to load the climate and soil data. This is where Google Earth Engine shines. There are petabytes of data hosted by Google and luckly for us, this includes the data from PRISM and SoilGrids. The datasets we are interested in are stored as seperate bands with unque names. The climate bands we are interested in are minimum temperature, mean temperature, and precipitation. It is important to note that the bands being selected are called "Image Collection" and have 12 images each. This is because each image represents the long-term average conditions for each month. For more information about the PRISM climate data, use the search bar to search for the dataset. The soil data was accessed from [here](https://git.wur.nl/isric/soilgrids/soilgrids.notebooks/-/blob/master/markdown/access_on_gee.md) and the image being selected is the soil Ph value at the surface (0-5cm). 

Insert Code Here

### Define the Optimal Crop Parameters 
Next, we define the crop parameters that we will use later on in the code. Notice that we could have just defined "tkill" as 4, but used addition to calculate the value instead. 

Insert Code Here

### Annual Precipitation Suitability
Now that we have loaded in the relevant data layers and defined our crop parameters, we are ready to start analyzing the data to identify areas that meet the the optimal suitability thresholds. We will start with annual precipitation. Since we are interested in annual precipitation and the data we have is monthly precipitation, we need to calculate the sum of all images. This is acheived through using a reducer and looks like this: ".reduce(ee.Reducer.sum())". Once we have our annual precipitation layer, all we need to do is identify all areas that are greater than or equal to the minimum threshold (800 mm) AND less than or equal to the maximum threshold (1500 mm). The result is a boolean image with values of 1 for areas that meet the suitability threshold and 0 for areas that do not. 

Insert Code Here

### Define Functions for Mean Temperature Suitability and Survivability
Next, we look at mean temperature and minimum temperature. Unlike with precipitation, we want monthly data for mean and minimun temperature. As such, we need to apply the same suitability thresholds to each month in the image collection. To do this, we define seperate functions for suitable mean temperatures and minimum temperatures.  
