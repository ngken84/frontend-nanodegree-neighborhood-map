
function initialize() {

	ko.applyBindings(new MapViewModel());

};

var MapOptions = function() {
	var self = this;

	self.preferences = [
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
}

var PlaceType = function(name, type, selected) {
	var self = this;
	self.typeName = type;
	self.name = name;
	self.isSelected = ko.observable(selected);
}



var MapPlace = function(googlePlace) {
	var self = this;
	self.placeResult = googlePlace;
	self.imageUrl = "http://maps.googleapis.com/maps/api/streetview?size=560x200&location=" + self.placeResult.geometry.location.G + ","+ self.placeResult.geometry.location.K;

	self.isWikiLoaded = ko.observable(false);
	self.isWikiFailed = ko.observable(false);
	self.wikiInformation = ko.observableArray([]);

	self.loadWikipediaData = function() {
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
	};
};

var MapViewModel = function() {
	var self = this;

	self.placesArray = ko.observableArray([]);
	self.currentPlace = ko.observable(null);

	self.myLocation = ko.computed(function() {
		return new google.maps.LatLng(37.4434263, -122.176138);
	});

	self.options = new MapOptions();

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
		mapPlace.loadWikipediaData();
	}

	self.updatePlaces({
		location : self.myLocation(),
		radius : '500',
		types : ['restaurant']
	});

};