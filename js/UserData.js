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
}

// generates the key used for the localStorage data.
UserData.prototype.getLocalStorageKey = function() {
	return 'kenmap-' + this.googleCode;
}

