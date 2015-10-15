/*
Map Place object contains an place returned by the google places api. Also contains information pulled from various services on those places.
*/
var MapPlace = function(googlePlace, googleMap, openModalFunction) {
	var self = this;

	self.placeResult = googlePlace;

	//Image URL base on google street view api
	self.imageUrl = "http://maps.googleapis.com/maps/api/streetview?size=560x200&location=" + self.placeResult.geometry.location.lat() + ","+ self.placeResult.geometry.location.lng();

	self.loadImageData = function() {
		var infoWindow = $('#info-img-window');
		infoWindow.empty();
		var image = document.createElement('img');
		image.className = "img-responsive";
		image.src = self.imageUrl;
		image.onload = function() {
			infoWindow.prepend(image);
		};
	};

	// Data from wikipedia
	self.isWikiLoaded = ko.observable(false);
	self.isWikiFailed = ko.observable(false);
	self.wikiInformation = ko.observableArray([]);

	self.selectPlace = openModalFunction;

	// Loads data from Wikipedia web service.
	self.loadWikipediaData = function() {
		if(!self.isWikiLoaded()) {
			$.ajax('https://en.wikipedia.org/w/api.php?action=opensearch&search=' + self.placeResult.name + '&prop=revisions&rvprop=content&format=json&callback=wikiCallback',
				{
					dataType: 'jsonp',
					jsonp: 'callback',
					timeout: 2000,
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
					},
					error: function(XHR, textStatus, errorThrown) {
						self.isWikiFailed(true);
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
	};

	//Data from Google Place Details web service
	self.isGoogleDataLoaded = ko.observable(false);
	self.googleData = ko.observable(null);

	self.checkIfObjectHasProperty = function(data, property) {
		if(!data.hasOwnProperty(property)){
			data[property] = null;
		}
	};

	self.loadGoogleData = function(placeService) {
		if(!self.isGoogleDataLoaded() && self.placeResult.place_id) {
			placeService.getDetails({placeId: self.placeResult.place_id}, function (data, result) {
				self.checkIfObjectHasProperty(data, 'formatted_phone_number');
				self.checkIfObjectHasProperty(data, 'website');
				self.checkIfObjectHasProperty(data, 'reviews');
				if(data.reviews) {
					for(var i = 0, x = data.reviews.length; i < x; i++) {
						self.checkIfObjectHasProperty(data.reviews[i], 'author_url');
					}
				}
				self.googleData(data);
			});
		}
	};

	// Creates a marker on the map
	self.createMarker = function(gMap, clickFunction) {
		var image = {
			url: self.placeResult.icon,
			scaledSize: new google.maps.Size(40, 40),
			origin: new google.maps.Point(0, 0),
			anchor: new google.maps.Point(0, 40)
		};

		var shape = {
			coords: [1,1,1,40,40,40,40,1],
			type: 'poly'
		};

		self.marker = new google.maps.Marker({
			position : self.getLocation(),
			map : gMap,
			icon: image,
			shape: shape
		});

		// Adds click listener for the map marker.
		self.marker.addListener('click', function() {
			if(clickFunction) {
				clickFunction(self);
			}
			self.marker.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function() {
				self.marker.setAnimation(google.maps.Animation.NONE);
			}, 2500);
		});
	};

	self.createInfoWindow = function() {

		var contentString = self.getInfoWindowText();
		var infoWindow = new google.maps.InfoWindow({
			content: contentString
		});
		self.selectPlace(self, infoWindow);
		infoWindow.open(googleMap, self.marker);
	};

	self.createMarker(googleMap, self.createInfoWindow);

	self.userData = new UserData(self.placeResult.place_id);
};

MapPlace.prototype.getInfoWindowText = function() {
	return "<div data-toggle='modal' data-target='#myModal'><h4>" + this.placeResult.name + "</h4><p>" + this.placeResult.vicinity + "</p></div>";
};

// gets google maps LatLng object for the place
MapPlace.prototype.getLocation = function() {
	var location = this.placeResult.geometry.location;
	return new google.maps.LatLng(location.lat(), location.lng());
};

// Adds bouncing animation to the marker
MapPlace.prototype.animateMarker = function() {
	if(this.marker !== null) {
		this.marker.setAnimation(google.maps.Animation.BOUNCE);
	}
};

// Stops any animation of the marker
MapPlace.prototype.stopAnimation = function() {
	if(this.marker !== null) {
		this.marker.setAnimation(google.maps.Animation.NONE);
	}
};

// removes the marker from the map
MapPlace.prototype.removeMarker = function() {
	if(this.marker) {
		this.marker.setMap(null);
		this.marker = null;
	}
};

// returns true if the text passed is contained in the map place's name or address
MapPlace.prototype.doesMatchFilter = function(filterText) {
	if(filterText) {
		if(filterText.length === 0) {
			return true;
		}
		var text = filterText.toUpperCase();
		return (this.placeResult.name.toUpperCase().indexOf(text) != -1) || (this.placeResult.vicinity.toUpperCase().indexOf(text) != -1);
	}
	return true;
};