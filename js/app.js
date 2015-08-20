
function initialize() {

	ko.applyBindings(new MapViewModel());

};


var MapPlace = function(googlePlace) {
	var self = this;

	self.name = googlePlace.name;
	self.address = googlePlace.vicinity;

	var location = googlePlace.geometry.location;
	self.longitude = location.G;
	self.latitude = location.K;

	self.imageUrl = "http://maps.googleapis.com/maps/api/streetview?size=560x200&location=" + self.longitude + ","+ self.latitude;

	// self.streetViewImage = ko.computed(function() {
	// 	var location = self.placeResult.geometry.location;
	// 	return "http://maps.googleapis.com/maps/api/streetview?size=560x200&location=" + location.G + ","+location.K;
	// });

	// console.log(googlePlace.name + " " + googlePlace.address_components[i].long_name)

};

var MapViewModel = function() {
	var self = this;

	self.placesArray = ko.observableArray([]);
	self.currentPlace = ko.observable(null);


	self.myLocation = ko.computed(function() {
		return new google.maps.LatLng(37.4434263, -122.176138);
	});

	self.map = new google.maps.Map(document.getElementById('map'), {
		center: self.myLocation(),
		zoom: 17
	});

	self.placesService = new google.maps.places.PlacesService(self.map);

	self.placeServiceCallback = function (results, status) {
		if(status == google.maps.places.PlacesServiceStatus.OK) {
			self.placesArray.removeAll();
			for(var i = 0, x = results.length; i < x; i++){
				self.placesArray.push(new MapPlace(results[i]));
			}
		}
	}

	self.updatePlaces = function(request) {
		self.placesService.nearbySearch(request, self.placeServiceCallback);
	}

	self.selectPlace = function(mapPlace) {
		self.currentPlace(mapPlace);
	}

	self.updatePlaces({
		location : self.myLocation(),
		radius : '500',
		types : ['restaurant']
	});








};