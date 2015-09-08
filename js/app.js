/*
Initialize runs when the after the google map is finished loading. Sets up the ViewModel and side panel
*/
function initialize() {
	ko.applyBindings(new MapViewModel());

	$("#side-panel-open-btn").click(function() {
		$("#side-panel").slideToggle();
		$("#side-panel-open-btn").hide();
		$("#map-container").css("right", "15px");
		$("#map").css("margin-left", "0");
	});

	$("#close-panel-btn").click(function() {
		$("#side-panel").slideToggle();
		$("#side-panel-open-btn").show();
		$("#map-container").css("right", "20px");
		$("#map").css("margin-left", "20px");
	});
};

/*
MapOptions contains the
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

	// gets Google LatLng object.
	self.getLocation = function() {
		return new google.maps.LatLng(self.latitude, self.longitude);
	};

	//Returns google options object.
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

	//Update location of center of the map.
	self.setLocation = function(lat, lon) {
		self.latitude = lat;
		self.longitude = lon;
	};

	//Updates local storage with map preferences
	self.updateLocalStorage = function() {
		var stringOptions = JSON.stringify(ko.toJS(self));
		localStorage.setItem('kenmap-mapOptions', stringOptions);
	}
};

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
Map Place object contains an place returned by the google places api. Also contains information pulled from various services on those places.
*/
var MapPlace = function(googlePlace, googleMap, iconLabel, openModalFunction) {
	var self = this;

	self.placeResult = googlePlace;

	//Image URL base on google street view api
	self.imageUrl = "http://maps.googleapis.com/maps/api/streetview?size=560x200&location=" + self.placeResult.geometry.location.G + ","+ self.placeResult.geometry.location.K;
	self.labelIcon = iconLabel;


	// Data from wikipedia
	self.isWikiLoaded = ko.observable(false);
	self.isWikiFailed = ko.observable(false);
	self.wikiInformation = ko.observableArray([]);

	// Loads data from Wikipedia web service.
	self.loadWikipediaData = function() {
		if(!self.isWikiLoaded()) {
			$.ajax('https://en.wikipedia.org/w/api.php?action=opensearch&search=' + self.placeResult.name + '&prop=revisions&rvprop=content&format=json&callback=wikiCallback',
				{
					dataType: 'jsonp',
					jsonp: 'callback',
					success: function(data, textStatus, jq) {
						if(textStatus === "success" && data && data.length === 4 && data[1].length > 0) {
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

	// Data from New Yorks Times web service
	self.isNYTimesLoaded = ko.observable(false);
	self.isNYTimesFailed = ko.observable(false);
	self.nytInformation = ko.observableArray([]);

	// Loads data from the New York Times web service
	self.loadNYTimesData = function() {
		if(!self.isNYTimesLoaded()) {
			var NYT_URL = 'http://api.nytimes.com/svc/search/v2/articlesearch.json?q=' + self.placeResult.name + '&api-key=6cbb4b8bb025f0865f9afc276c97f269:8:72368218';
			$.getJSON(NYT_URL, function(data, textStatus) {
				if(textStatus ==="success" && data && data.response.docs) {
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
				} else {
					self.isNYTimesFailed(true);
				}
			}).fail(function() {
				self.isNYTimesFailed(true);
			}).always(function() {
				self.isNYTimesLoaded(true);
			});
		}
	}

	//Data from Google Place Details web service
	self.isGoogleDataLoaded = ko.observable(false);
	self.googleData = ko.observable(null);

	self.checkIfObjectHasProperty = function(data, property) {
		if(!data.hasOwnProperty(property)){
			data[property] = null;
		}
	}

	self.loadGoogleData = function(placeService) {
		if(!self.isGoogleDataLoaded() && self.placeResult['place_id']) {
			placeService.getDetails({placeId: self.placeResult['place_id']}, function (data, result) {
				console.log(data);
				self.checkIfObjectHasProperty(data, 'formatted_phone_number');
				self.checkIfObjectHasProperty(data, 'website');
				self.checkIfObjectHasProperty(data, 'reviews');
				if(data.reviews) {
					for(var i = 0, x = data.reviews.length; i < x; i++) {
						self.checkIfObjectHasProperty(data.reviews[i], 'author_url')
					}
				}
				self.googleData(data);
			});
		}
	};



	// gets google maps LatLng object for teh place
	self.getLocation = function() {
		var location = self.placeResult.geometry.location;
		return new google.maps.LatLng(location.G, location.K);
	};

	// creates a marker on the map
	self.createMarker = function(gMap, clickFunction) {
		self.marker = new google.maps.Marker({
			position : self.getLocation(),
			map : gMap,
			label : iconLabel
		});

		// Adds click listener for the map marker.
		self.marker.addListener('click', function() {
			if(clickFunction) {
				clickFunction(self);
			}
			self.marker.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function() {
				self.marker.setAnimation(google.maps.Animation.NONE);
			}, 2500)
		});
	}

	// removes the marker from the map
	self.removeMarker = function() {
		if(self.marker) {
			self.marker.setMap(null);
			self.marker = null;
		}
	}

	self.createMarker(googleMap, openModalFunction);

	// returns true if the text passed is contained in the map place's name or address
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

/*
User data for a map place. Contains user comments and rating.
*/
var UserData = function(googleCode) {
	var self = this;
	// google place code
	self.googleCode = googleCode;

	// user rating of the place
	self.rating = ko.observable(0);

	// list of user comments. Object contains a comment and the date the comment was made.
	self.commentArray = ko.observableArray([]);
	self.newComment = ko.observable("");

	// generates the key used for the localStorage data.
	self.getLocalStorageKey = function() {
		return 'kenmap-' + self.googleCode;
	};

	// initializes the User Data object. If data exists locally then grab it.
	self.initialize = function() {
		var key = self.getLocalStorageKey();
		var localData = localStorage.getItem(key);
		if(localData) {
			localData = JSON.parse(localData);
			self.rating = ko.observable(localData.rating);
			self.commentArray = ko.observableArray(localData.commentArray);
		}
	};

	// adds a comment if the newComment object is not empty. Also updates the local storage object.
	self.addComment = function() {
		if(self.newComment().length > 0) {
			var d = new Date();
			var dateStr = (d.getMonth() + 1) + '-' + d.getDate() + '-' + d.getFullYear();
			self.commentArray.push({
				date: dateStr,
				comment: self.newComment()
			});

			// if the objects has a googleCode, then update the local storage object.
			if(self.googleCode) {
				localStorage.setItem(self.getLocalStorageKey(), JSON.stringify(ko.toJS(self)));
			}
			self.newComment("");
		}
	};

	self.initialize();
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

	// The Google Map Object
	self.map = new google.maps.Map(document.getElementById('map'), {
		center: self.mapOptions.getLocation(),
		zoom: 17
	});

	// Places Service Object
	self.placesService = new google.maps.places.PlacesService(self.map);


	self.placeServiceCallback = function (results, status) {
		if(status == google.maps.places.PlacesServiceStatus.OK) {
			var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			self.resetMarkers();
			self.placesArray = [];
			self.placesFilteredArray.removeAll();
			for(var i = 0, x = Math.min(results.length, labels.length); i < x; i++){
				self.placesArray.push(new MapPlace(results[i], self.map, labels[i], self.openModal));
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

	// Call back for when a user selects a new neighborhood location in a list.
	self.selectNewAddress = function(place) {
		self.mapOptions.setLocation(place.geometry.location.G, place.geometry.location.K);
		self.map.setCenter(place.geometry.location);
		self.updatePlaces();
		$('#locationsPickerModal').modal('hide');
	};
};

