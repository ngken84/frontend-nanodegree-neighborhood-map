/*
Initialize runs when the after the google map is finished loading.
Sets up the ViewModel and side panel click listeners.
*/
function initialize() {
	ko.applyBindings(new MapViewModel());

	var toggleLocations = function() {
		$("#side-panel").slideToggle();
		$("#side-panel-open-btn").hide();
	}

	$("#open-list-btn").click(toggleLocations);
	$(".navbar-brand").click(toggleLocations);
};

/*
The actual map view model.
*/
var MapViewModel = function() {
	var self = this;

	// This contains all the places return by the places API
	self.placesArray = [];

	// This contains the list of places that will be shown on the map.
	self.placesFilteredArray = ko.observableArray([]);

	// The current place displayed in the modal
	self.currentPlace = ko.observable(null);

	// The search phrase that will filter the shown places
	self.searchTerm = ko.observable('');

	// Map options object that dictates what places are displayed on the map
	self.mapOptions = new MapOptions();

	// Dictates several states
	self.isLoading = ko.observable(true);
	self.isEmpty = ko.observable(false);
	self.isError = ko.observable(false);

	self.initializeMap = function() {
		var mapStyle = [{
			elementType: "labels.icon",
			stylers: [{ visibility: "off"}]
		}];

		// Set up map options
		var styledMap = new google.maps.StyledMapType(mapStyle, {name: "Styled Map"});

		// The Google Map Object
		self.map = new google.maps.Map(document.getElementById('map'), {
			center: self.mapOptions.getLocation(),
			zoom: 17
		});

		self.map.mapTypes.set('map_style', styledMap);
		self.map.setMapTypeId('map_style');
	};



	self.initializeMap();

	// Places Service Object
	self.placesService = new google.maps.places.PlacesService(self.map);


	self.placeServiceCallback = function (results, status) {
		if(status == google.maps.places.PlacesServiceStatus.OK) {
			self.resetMarkers();
			self.placesArray = [];
			self.placesFilteredArray.removeAll();
			for(var i = 0, x = results.length; i < x; i++){
				self.placesArray.push(new MapPlace(results[i], self.map, self.openModal));
			}
			self.placesFilteredArray(self.placesArray);
			self.isEmpty(false);
			self.isError(false);
			self.isLoading(false);
		} else if(status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
			self.isLoading(false);
			self.isError(false);
			self.isEmpty(true);
		} else {
			self.isLoading(false);
			self.isError(true);
			self.isEmpty(false);
		}
	}

	// Removes all markers on the map
	self.resetMarkers = function() {
		for(var i = 0, x = self.placesArray.length; i < x; i++) {
			self.placesArray[i].removeMarker();
		}
	}

	// Opens the modal
	self.openModal = function(mapPlace) {
		self.selectPlace(mapPlace);
		$('#myModal').modal('show');
	}


	// Does a new search base on the current MapOptions object.
	self.updatePlaces = function() {
		self.isLoading(true);
		self.resetMarkers();
		var request = self.mapOptions.getOptionsObject();
		self.placesService.nearbySearch(request, self.placeServiceCallback);
		self.mapOptions.updateLocalStorage();
	}

	// Updates the current place
	self.selectPlace = function(mapPlace) {
		self.currentPlace(mapPlace);
		mapPlace.loadWikipediaData();
		mapPlace.loadNYTimesData();
		mapPlace.loadGoogleData(self.placesService);
	};

	// Filters the current places array based on the search term
	self.filterPlaces = function() {
		var filter = self.searchTerm();
		var newArray = [];
		self.resetMarkers();
		for(var i = 0, x = self.placesArray.length; i < x; i++) {
			if(self.placesArray[i] && self.placesArray[i].doesMatchFilter(filter)) {
				newArray.push(self.placesArray[i]);
				self.placesArray[i].createMarker(self.map, self.openModal);
			}
		}
		self.placesFilteredArray(newArray);
	};
	self.updatePlaces();

	self.geocoder = new google.maps.Geocoder();

	// Entry for a new address in the Search bar
	self.newAddress = ko.observable("");

	// If the new address has multiple possible results it is contained here.
	self.partialAddressList = ko.observableArray([]);

	// Searches for a new neighborhood
	self.updateAddress = function() {
		var address = self.newAddress();
		if(address && address.length > 0) {
			self.geocoder.geocode({'address': address}, self.geocodeCallback);
		} else {
			alert('Please enter a valid address');
		}
	};

	self.geocodeCallback = function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			if(results.length == 1) {
				var lat = results[0].geometry.location.lat();
				var lon = results[0].geometry.location.lng();
				self.map.setCenter(results[0].geometry.location);
				self.mapOptions.setLocation(lat, lon);
				self.updatePlaces();
			} else if(results.length == 0) {
				alert("No locations found matching that address");
			} else {
				self.partialAddressList(results);
				$('#locationsPickerModal').modal('show');
			}
		} else {
			alert('Unable to contact Google Services');
		}
	};

	// Call back for when a user selects a new neighborhood location in a list.
	self.selectNewAddress = function(place) {
		self.mapOptions.setLocation(place.geometry.location.lat(), place.geometry.location.lng());
		self.map.setCenter(place.geometry.location);
		self.updatePlaces();
		$('#locationsPickerModal').modal('hide');
	};
};

