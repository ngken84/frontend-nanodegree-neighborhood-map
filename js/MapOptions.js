/*
Place type option.
*/
var PlaceType = function(name, type, selected) {
	var self = this;
	self.typeName = type;
	self.placeTypeId = "map_options_" + type;
	self.name = name;
	self.isSelected = ko.observable(selected);
};


/*
MapOptions contains the options that dictate what types of places will be marked on the map.
*/
var MapOptions = function() {
	var self = this;

	//Latitude and Longitude of place of interest. Set for 69 University Dr. Menlo Park CA.
	self.latitude = 37.4434263;
	self.longitude = -122.176138;

	// Sets the types of places the user will be searching for.
	self.placeTypePrefs = [
		new PlaceType('Airport', 'airport', false),
		new PlaceType('Amusement Park', 'amusement_park', false),
		new PlaceType('Aquarium', 'aquarium', false),
		new PlaceType('Art Gallery', 'art_gallery', false),
		new PlaceType('ATM', 'atm', false),
		new PlaceType('Bank', 'bank', false),
		new PlaceType('Bar', 'bar', true),
		new PlaceType('Beauty Salon', 'beauty_salon', false),
		new PlaceType('Book Store', 'book_store', false),
		new PlaceType('Bowling Alley', 'bowling_alley', false),
		new PlaceType('Bus Station', 'bus_station', false),
		new PlaceType('Cafe', 'cafe', true),
		new PlaceType('Campground', 'campground', false),
		new PlaceType('Casino', 'casino', false),
		new PlaceType('Convenience Store', 'convenience_store', true),
		new PlaceType('Gas Station', 'gas_station', false),
		new PlaceType('Grocery Store', 'grocery_or_supermarket', false),
		new PlaceType('Gym', 'gym', false),
		new PlaceType('Library', 'library', false),
		new PlaceType('Movie Theatre', 'movie_theatre', true),
		new PlaceType('Museum', 'museum', false),
		new PlaceType('Night Club', 'night_club', false),
		new PlaceType('Pharmacy', 'pharmacy', false),
		new PlaceType('Restaurant', 'restaurant', true),
		new PlaceType('Store', 'store', true),
		new PlaceType('Zoo', 'zoo', false)
	];

	// Sets the range of the search
	self.range = ko.observable('500');

	// Sets up the Map Options objects. Looks in localStorage for existing preferences, but if they do not exist use default ones.
	self.initialize = function() {
		var localSettings = localStorage.getItem('kenmap-mapOptions');
		if(localSettings) {
			localSettings = JSON.parse(localSettings);
			self.latitude = localSettings.latitude;
			self.longitude = localSettings.longitude;
			var localArray = localSettings.placeTypePrefs;
			for(var i = 0, x = Math.min(localSettings.placeTypePrefs.length, self.placeTypePrefs.length); i < x; i++) {
				if(self.placeTypePrefs[i].typeName == localSettings.placeTypePrefs[i].typeName) {
					self.placeTypePrefs[i].isSelected(localSettings.placeTypePrefs[i].isSelected);
				}
			}
			self.range(localSettings.range);
		}
	};

	self.initialize();
};

// gets Google LatLng object.
MapOptions.prototype.getLocation = function () {
	return new google.maps.LatLng(this.latitude, this.longitude);
};

//Update location of center of the map.
MapOptions.prototype.setLocation = function(lat, lon) {
	this.latitude = lat;
	this.longitude = lon;
};

//Updates local storage with map preferences
MapOptions.prototype.updateLocalStorage = function() {
	var stringOptions = JSON.stringify(ko.toJS(this));
	localStorage.setItem('kenmap-mapOptions', stringOptions);
};

MapOptions.prototype.getOptionsObject = function() {
	var placeTypeArray = [];
	for(var i = 0, x = this.placeTypePrefs.length; i < x; i++) {
		if(this.placeTypePrefs[i].isSelected()) {
			placeTypeArray.push(this.placeTypePrefs[i].typeName);
		}
	}
	return {
		location: this.getLocation(),
		radius: this.range(),
		types: placeTypeArray
	};
};
