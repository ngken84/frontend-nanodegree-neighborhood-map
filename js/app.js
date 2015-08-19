
function initialize() {

	ko.applyBindings(new MapViewModel());
	// var myLocation = new google.maps.LatLng(37.4434263, -122.176138);

	// map = new google.maps.Map(document.getElementById('map'), {
	// 	center: myLocation,
	// 	zoom: 17
	// });

	// var request = {
	// 	location : myLocation,
	// 	radius : '500',
	// 	types: ['store']
	// }

	// function callback(results, status) {
	// 	if(status == google.maps.places.PlacesServiceStatus.OK) {
	// 		for (var i = 0, x = results.length; i < x; i++) {
	// 			console.log(i + " : " + results[i].name);
	// 		}
	// 	}
	// }

	// placesService = new google.maps.places.PlacesService(map);
	// placesService.nearbySearch(request, callback);
}

var MapViewModel = function() {
	var self = this;

	self.longitude = ko.observable(37.4434263);
	self.latitude = ko.observable(-122.176138);

	self.myLocation = ko.computed(function() {
		return new google.maps.LatLng(self.longitude(), self.latitude());
	});

	self.map = new google.maps.Map(document.getElementById('map'), {
		center: self.myLocation(),
		zoom: 17
	});

	self.placesService = new google.maps.places.PlacesService(map);
	placesService.nearbySearch(request, callback);







}