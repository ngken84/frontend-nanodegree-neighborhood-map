
function initialize() {
	ko.applyBindings(new MapViewModel());

	$("#side-panel-open-btn").click(function() {
		$("#side-panel").slideToggle();
		$("#side-panel-open-btn").hide();
		$("#map-container").css("right", "0");
		$("#map").css("margin-left", "0");
	});

	$("#close-panel-btn").click(function() {
		$("#side-panel").slideToggle();
		$("#side-panel-open-btn").show();
		$("#map-container").css("right", "20px");
		$("#map").css("margin-left", "20px");
	});
};

var MapOptions = function() {
	var self = this;

	self.latitude = 37.4434263;
	self.longitude = -122.176138;

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

	self.initialize = function() {
		var localSettings = localStorage.getItem('kenmap-mapOptions');
		if(localSettings) {
			localSettings = JSON.parse(localSettings);
			self.latitude = localSettings.latitude;
			self.longitude = localSettings.longitude;
			var localArray = localSettings["placeTypePrefs"];
			for(var i = 0, x = Math.min(localSettings.placeTypePrefs.length, self.placeTypePrefs.length); i < x; i++) {
				if(self.placeTypePrefs[i].typeName == localSettings.placeTypePrefs[i].typeName) {
					self.placeTypePrefs[i].isSelected(localSettings.placeTypePrefs[i].isSelected);
				}
			}
			self.range(localSettings.range);
		}
	}

	self.initialize();

	self.getLocation = function() {
		return new google.maps.LatLng(self.latitude, self.longitude);
	};

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

	self.setLocation = function(lat, lon) {
		self.latitude = lat;
		self.longitude = lon;
	};

	self.updateLocalStorage = function() {
		var stringOptions = JSON.stringify(ko.toJS(self));
		localStorage.setItem('kenmap-mapOptions', stringOptions);
	}
};

var PlaceType = function(name, type, selected) {
	var self = this;
	self.typeName = type;
	self.name = name;
	self.isSelected = ko.observable(selected);
};

var MapPlace = function(googlePlace, googleMap, iconLabel, openModalFunction) {
	var self = this;

	self.placeResult = googlePlace;
	console.log(googlePlace);
	if(self.placeResult.photos) {
		for(var i = 0, x = self.placeResult.photos.length; i < x; i++) {
			console.log(self.placeResult.photos[i].getUrl({maxWidth: 270}));
		}
	}
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
							for(var i = 0, x = Math.min(data[1].length, 5); i < x; i++)
							{
								array.push({
									name: data[1][i],
									link: data[3][i],
									desc: data[2][i]
								});
							}
							self.wikiInformation(array);
							if(array.length === 0) {
								self.isWikiFailed(true);
							}
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

	self.isNYTimesLoaded = ko.observable(false);
	self.isNYTimesFailed = ko.observable(false);
	self.nytInformation = ko.observableArray([]);

	self.loadNYTimesData = function() {
		if(!self.isNYTimesLoaded()) {
			var NYT_URL = 'http://api.nytimes.com/svc/search/v2/articlesearch.json?q=' + self.placeResult.name + '&api-key=6cbb4b8bb025f0865f9afc276c97f269:8:72368218';
			$.getJSON(NYT_URL, function(data) {
				var articleArray = data.response.docs;
				var array = [];
				for(var i = 0, x = Math.min(articleArray.length,5); i < x; i++) {
					var article = articleArray[i];
					array.push({
						name: article.headline.main,
						link: article.web_url,
						desc: article.snippet
					});
				}
				self.nytInformation(array);
				if(array.length === 0) {
					self.isNYTimesFailed(true);
				}
			}).fail(function() {
				self.isNYTimesFailed(true);
			}).always(function() {
				self.isNYTimesLoaded(true);
			});
		}
	}


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
	self.userData = new UserData(self.placeResult['place_id']);
};

var UserData = function(googleCode) {
	var self = this;

	self.googleCode = googleCode;

	self.rating = ko.observable(0);

	self.commentArray = ko.observableArray([]);

	self.newComment = ko.observable("");

	self.getLocalStorageKey = function() {
		return 'kenmap-' + self.googleCode;
	};

	self.initialize = function() {
		var key = self.getLocalStorageKey();
		var localData = localStorage.getItem(key);
		if(localData) {
			localData = JSON.parse(localData);
			self.rating = ko.observable(localData.rating);
			self.commentArray = ko.observableArray(localData.commentArray);
		}
	};



	self.addComment = function() {
		if(self.newComment().length > 0) {
			var d = new Date();
			var dateStr = (d.getMonth() + 1) + '-' + d.getDate() + '-' + d.getFullYear();
			self.commentArray.push({
				date: dateStr,
				comment: self.newComment()
			});
			console.log(self.googleCode);
			if(self.googleCode) {
				localStorage.setItem(self.getLocalStorageKey(), JSON.stringify(ko.toJS(self)));
			}
			self.newComment("");
		}
	};

	self.initialize();
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
			var labels = 'ABCDEFGHIJKLMNOP';
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
		self.mapOptions.updateLocalStorage();
	}

	self.selectPlace = function(mapPlace) {
		self.currentPlace(mapPlace);
		mapPlace.loadWikipediaData();
		mapPlace.loadNYTimesData();
	};

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

	self.newAddress = ko.observable("");
	self.partialAddressList = ko.observableArray([]);

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
				var lat = results[0].geometry.location.G;
				var lon = results[0].geometry.location.K;
				self.map.setCenter(results[0].geometry.location);
				self.mapOptions.setLocation(lat, lon);
				self.updatePlaces();
			} else if(results.length == 0) {
				alert("No locations found matching that address");
			} else {
				self.partialAddressList(results);
				$('#locationsPickerModal').modal('show');
				console.log(results);
			}
		} else {
			alert('Unable to contact Google Services');
		}
	};

	self.selectNewAddress = function(place) {
		self.mapOptions.setLocation(place.geometry.location.G, place.geometry.location.K);
		self.map.setCenter(place.geometry.location);
		self.updatePlaces();
		$('#locationsPickerModal').modal('hide');
	};
};

