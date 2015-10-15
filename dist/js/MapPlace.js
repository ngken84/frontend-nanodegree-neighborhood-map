var MapPlace=function(e,a,i){var o=this;o.placeResult=e,o.imageUrl="http://maps.googleapis.com/maps/api/streetview?size=560x200&location="+o.placeResult.geometry.location.lat()+","+o.placeResult.geometry.location.lng(),o.loadImageData=function(){var e=$("#info-img-window");e.empty();var a=document.createElement("img");a.className="img-responsive",a.src=o.imageUrl,a.onload=function(){e.prepend(a)}},o.isWikiLoaded=ko.observable(!1),o.isWikiFailed=ko.observable(!1),o.wikiInformation=ko.observableArray([]),o.selectPlace=i,o.loadWikipediaData=function(){o.isWikiLoaded()||$.ajax("https://en.wikipedia.org/w/api.php?action=opensearch&search="+o.placeResult.name+"&prop=revisions&rvprop=content&format=json&callback=wikiCallback",{dataType:"jsonp",jsonp:"callback",timeout:2e3,success:function(e,a){if("success"===a&&e&&4===e.length&&e[1].length>0){for(var i=[],t=0,n=Math.min(e[1].length,5);n>t;t++)i.push({name:e[1][t],link:e[3][t],desc:e[2][t]});o.wikiInformation(i),0===i.length&&o.isWikiFailed(!0)}else o.isWikiFailed(!0)},error:function(){o.isWikiFailed(!0)}}).fail(function(){o.isWikiFailed(!0)}).always(function(){o.isWikiLoaded(!0)})},o.isNYTimesLoaded=ko.observable(!1),o.isNYTimesFailed=ko.observable(!1),o.nytInformation=ko.observableArray([]),o.loadNYTimesData=function(){if(!o.isNYTimesLoaded()){var e="http://api.nytimes.com/svc/search/v2/articlesearch.json?q="+o.placeResult.name+"&api-key=6cbb4b8bb025f0865f9afc276c97f269:8:72368218";$.getJSON(e,function(e,a){if("success"===a&&e&&e.response.docs){for(var i=e.response.docs,t=[],n=0,s=Math.min(i.length,5);s>n;n++){var r=i[n];t.push({name:r.headline.main,link:r.web_url,desc:r.snippet})}o.nytInformation(t),0===t.length&&o.isNYTimesFailed(!0)}else o.isNYTimesFailed(!0)}).fail(function(){o.isNYTimesFailed(!0)}).always(function(){o.isNYTimesLoaded(!0)})}},o.isGoogleDataLoaded=ko.observable(!1),o.googleData=ko.observable(null),o.checkIfObjectHasProperty=function(e,a){e.hasOwnProperty(a)||(e[a]=null)},o.loadGoogleData=function(e){!o.isGoogleDataLoaded()&&o.placeResult.place_id&&e.getDetails({placeId:o.placeResult.place_id},function(e){if(o.checkIfObjectHasProperty(e,"formatted_phone_number"),o.checkIfObjectHasProperty(e,"website"),o.checkIfObjectHasProperty(e,"reviews"),e.reviews)for(var a=0,i=e.reviews.length;i>a;a++)o.checkIfObjectHasProperty(e.reviews[a],"author_url");o.googleData(e)})},o.createMarker=function(e,a){var i={url:o.placeResult.icon,scaledSize:new google.maps.Size(40,40),origin:new google.maps.Point(0,0),anchor:new google.maps.Point(0,40)},t={coords:[1,1,1,40,40,40,40,1],type:"poly"};o.marker=new google.maps.Marker({position:o.getLocation(),map:e,icon:i,shape:t}),o.marker.addListener("click",function(){a&&a(o),o.marker.setAnimation(google.maps.Animation.BOUNCE),setTimeout(function(){o.marker.setAnimation(google.maps.Animation.NONE)},2500)})},o.createInfoWindow=function(){var e=o.getInfoWindowText(),i=new google.maps.InfoWindow({content:e});o.selectPlace(o,i),i.open(a,o.marker)},o.createMarker(a,o.createInfoWindow),o.userData=new UserData(o.placeResult.place_id)};MapPlace.prototype.getInfoWindowText=function(){return"<div data-toggle='modal' data-target='#myModal'><h4>"+this.placeResult.name+"</h4><p>"+this.placeResult.vicinity+"</p></div>"},MapPlace.prototype.getLocation=function(){var e=this.placeResult.geometry.location;return new google.maps.LatLng(e.lat(),e.lng())},MapPlace.prototype.animateMarker=function(){null!==this.marker&&this.marker.setAnimation(google.maps.Animation.BOUNCE)},MapPlace.prototype.stopAnimation=function(){null!==this.marker&&this.marker.setAnimation(google.maps.Animation.NONE)},MapPlace.prototype.removeMarker=function(){this.marker&&(this.marker.setMap(null),this.marker=null)},MapPlace.prototype.doesMatchFilter=function(e){if(e){if(0===e.length)return!0;var a=e.toUpperCase();return-1!=this.placeResult.name.toUpperCase().indexOf(a)||-1!=this.placeResult.vicinity.toUpperCase().indexOf(a)}return!0};