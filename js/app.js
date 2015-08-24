
function initialize() {
	ko.applyBindings(new MapViewModel());
};

var MapOptions = function() {
	var self = this;

	self.latitude = 37.4434263;
	self.longitude = -122.176138;

	self.getLocation = function() {
		return new google.maps.LatLng(self.latitude, self.longitude);
	};

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

	self.range = ko.observable('500');

	self.getOptionsObject = function () {
		var placeTypeArray = [];
		for(var i = 0, x = self.placeTypePrefs.length; i < x; i++) {
			if(self.placeTypePrefs[i].isSelected()) {
				placeTypeArray.push(self.placeTypePrefs[i].typeName);
			}
		}
		return {
			location: self.getLocation(),
			radius: self.range(),
			types: placeTypeArray
		}
	};
}

var PlaceType = function(name, type, selected) {
	var self = this;
	self.typeName = type;
	self.name = name;
	self.isSelected = ko.observable(selected);
}

var MapPlace = function(googlePlace, googleMap, iconLabel, openModalFunction) {
	var self = this;
	self.placeResult = googlePlace;
	self.imageUrl = "http://maps.googleapis.com/maps/api/streetview?size=560x200&location=" + self.placeResult.geometry.location.G + ","+ self.placeResult.geometry.location.K;
	self.labelIcon = iconLabel;

	self.isWikiLoaded = ko.observable(false);
	self.isWikiFailed = ko.observable(false);
	self.wikiInformation = ko.observableArray([]);

	self.loadWikipediaData = function() {
		if(!self.isWikiLoaded()) {
			$.ajax('https://en.wikipedia.org/w/api.php?action=opensearch&search=' + self.placeResult.name + '&prop=revisions&rvprop=content&format=json&callback=wikiCallback',
				{
					dataType: 'jsonp',
					jsonp: 'callback',
					success: function(data, textStatus, jq) {
						if(data && data.length === 4 && data[1].length > 0) {
							var array = [];
							for(var i = 0, x = data[1].length; i < x; i++)
							{
								array.push({
									name: data[1][i],
									link: data[3][i],
									desc: data[2][i]
								});
							}
							self.wikiInformation(array);
						} else {
							self.isWikiFailed(true);
						}
					}
				}).fail(function() {
				self.isWikiFailed(true);
			}).always(function() {
				self.isWikiLoaded(true);
			});
		}
	};

	self.getLocation = function() {
		var location = self.placeResult.geometry.location;
		return new google.maps.LatLng(location.G, location.K);
	};

	self.createMarker = function(gMap, clickFunction) {
		self.marker = new google.maps.Marker({
			position : self.getLocation(),
			map : gMap,
			label : iconLabel
		});

		self.marker.addListener('click', function() {
			if(clickFunction) {
				clickFunction(self);
			}
		});
	}

	self.removeMarker = function() {
		if(self.marker) {
			self.marker.setMap(null);
			self.marker = null;
		}
	}

	self.createMarker(googleMap, openModalFunction);

	self.doesMatchFilter = function(filterText) {
		if(filterText) {
			if(filterText.length == 0) {
				return true;
			}
			var text = filterText.toUpperCase();
			return (self.placeResult.name.toUpperCase().indexOf(text) != -1)
				|| (self.placeResult.vicinity.toUpperCase().indexOf(text) != -1);
		}
		return true;
	};

};

var MapViewModel = function() {
	var self = this;
	self.placesArray = [];
	self.placesFilteredArray = ko.observableArray([]);
	self.currentPlace = ko.observable(null);
	self.searchTerm = ko.observable('');

	self.mapOptions = new MapOptions();

	self.isLoading = ko.observable(true);

	self.map = new google.maps.Map(document.getElementById('map'), {
		center: self.mapOptions.getLocation(),
		zoom: 17
	});

	self.placesService = new google.maps.places.PlacesService(self.map);

	self.placeServiceCallback = function (results, status) {
		if(status == google.maps.places.PlacesServiceStatus.OK) {
			var labels = 'ABCDEFGHIJKLM';
			self.resetMarkers();
			self.placesArray = [];
			self.placesFilteredArray.removeAll();
			for(var i = 0, x = Math.min(results.length, labels.length); i < x; i++){
				self.placesArray.push(new MapPlace(results[i], self.map, labels[i], self.openModal));
			}
			self.placesFilteredArray(self.placesArray);
			self.isLoading(false);
		}
	}

	self.resetMarkers = function() {
		for(var i = 0, x = self.placesArray.length; i < x; i++) {
			self.placesArray[i].removeMarker();
		}
	}

	self.openModal = function(mapPlace) {
		self.selectPlace(mapPlace);
		$('#myModal').modal('show');
	}

	self.updatePlaces = function() {
		self.isLoading(true);
		self.resetMarkers();
		var request = self.mapOptions.getOptionsObject();
		self.placesService.nearbySearch(request, self.placeServiceCallback);
	}

	self.selectPlace = function(mapPlace) {
		self.currentPlace(mapPlace);
		mapPlace.loadWikipediaData();
	};

	self.filterPlaces = function() {
		var filter = self.searchTerm();
		var newArray = [];
		self.resetMarkers();
		for(var i = 0, x = self.placesArray.length; i < x; i++) {
			if(self.placesArray[i] && self.placesArray[i].doesMatchFilter(filter)) {
				newArray.push(self.placesArray[i]);
				self.placesArray[i].createMarker(self.map);
			} 
		}
		self.placesFilteredArray(newArray);
	};

	self.updatePlaces();

};