
function initialize() {

	ko.applyBindings(new MapViewModel());

}


var MapPlace = function(googlePlace) {
	var self = this;

	self.placeResult = googlePlace;

}

var MapViewModel = function() {
	var self = this;

	self.longitude = ko.observable(37.4434263);
	self.latitude = ko.observable(-122.176138);
	self.placesArray = ko.observableArray([]);


	self.myLocation = ko.computed(function() {
		return new google.maps.LatLng(self.longitude(), self.latitude());
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

	self.updatePlaces({
		location : self.myLocation(),
		radius : '500',
		types : ['store']
	});








}