//<![CDATA[
var map_latlng = new google.maps.LatLng(25.034156, 121.564467);
var map = null;
var from_MRT_Marker = null;
var user_destination = null;
var src_infowindow = null;
var des_infowindow = null;
var food_infowindow = null;
var des_address_string = null;
var user_destination_Marker = null;
var directionsService = null;
var directionsDisplay = null;

(function(window,undefined){

	$.cookie('GEAR', null);
    // Bind to StateChange Event
    History.Adapter.bind(window,'statechange',function(){ // Note: We are using statechange instead of popstate
		console.log("statechange called");
        /*var State = History.getState(); // Note: We are using History.getState() instead of event.state
		var data = State.data;
		if (typeof(Storage) !== "undefined") {
			// Code for localStorage/sessionStorage.
			SaveDataToLocalStorage(data["targetaddr"]);
		} else {
			console.log("not support storage");
			// Sorry! No Web Storage support..
		}*/
    });

})(window);

var browser_key=[
	"AIzaSyBQnFRGQmgDSMFj6rvvsMb8oS3DO1TWAds",
	"AIzaSyADLQu0nxhAVrsyNERxX8H9fXItLyMKZV8"
];

function SaveDataToLocalStorage(data)
{
	if (typeof(Storage) !== "undefined") {

		console.dir(localStorage);
		var a = [];

		if(JSON.parse(localStorage.getItem('targetaddr'))){
			// Parse the serialized data back into an aray of objects
			a = JSON.parse(localStorage.getItem('targetaddr'));
		}
		// Push the new data (whether it be an object or anything else) onto the array
		var not_equal = true;
		if(a.length > 9){
			a.pop();
		}
		for ( var i = 0; i < a.length; i++ ) {
			if ( a[i] == data) {
				not_equal = false;
				break;
			}
		}
		if(not_equal==true) {
			//a.push(data);
			a.unshift(data);
			// Re-serialize the array back into a string and store it in localStorage
			localStorage.setItem('targetaddr', JSON.stringify(a));
			console.log("update autocomplete source");
			$('#targetaddr').autocomplete( "option", "source", a);
		}
	}
	else {
		console.log("not support storage");
		// Sorry! No Web Storage support..
	}
}

function init_map(_latlng, _resovle_lat_lng) {
	var mapOptions = {
		center: _latlng,
		zoom: 13,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		scrollwheel:false,
		disableDoubleClickZoom: true
	};				
	map = new google.maps.Map(document.getElementById('map'), mapOptions);

    // a marker to show MRT exit
    from_MRT_Marker = new google.maps.Marker({
		map: map,
		icon: {
			path: google.maps.SymbolPath.CIRCLE,
			fillColor: '#1794ce', 
			fillOpacity: 1,
			strokeColor: '#1794ce', 
			strokeWeight: 40,
			strokeOpacity: 0.3,
			scale: 10 
		}					
	});
	var Opac = 0.3;
	setInterval(function(){
		from_MRT_Marker.setIcon({
			path: google.maps.SymbolPath.CIRCLE,
			fillColor: '#1794ce', 
			fillOpacity: 1,
			strokeColor: '#1794ce', 
			strokeWeight: 40,
			strokeOpacity: Opac,
			scale: 10 
		});
		Opac = Opac - 0.01;
		if (Opac<0) {
			Opac = 0.3;
		}
	}, 75); 				
    user_destination = new google.maps.LatLng(_resovle_lat_lng);
    user_destination_Marker = new google.maps.Marker({
		map: map
	});

    src_infowindow = new google.maps.InfoWindow();
    des_infowindow = new google.maps.InfoWindow();
	food_infowindow = new google.maps.InfoWindow();

   	directionsService = new google.maps.DirectionsService();
	directionsDisplay = new google.maps.DirectionsRenderer({
		suppressMarkers: true
	});

	// enable submit button when google map is ready.
	$('#submit-btn').attr("disabled", false);
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function initialize(_latlng, _resovle_lat_lng, targetaddr, embed, csrf_token) {
	init_map(_latlng, _resovle_lat_lng);

	var input = document.getElementById('targetaddr');
    var autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo('bounds', map);

   	// search keyword auto complete listener
    google.maps.event.addListener(autocomplete, 'place_changed', function() {
        var place = autocomplete.getPlace();
		if(place && place.geometry) {
			if(user_destination.toString() != place.geometry.location.toString()){
		        if(src_infowindow)
		        	src_infowindow.close();
		        if(des_infowindow)
		        	des_infowindow.close();						
				if (place.geometry.viewport) {
					map.fitBounds(place.geometry.viewport);
				} else {
					map.setCenter(place.geometry.location);
					map.setZoom(17); // Why 17? Because it looks good.
				}
				// set specific marker icon and its position to autocompleted location
				var image = new google.maps.MarkerImage(
				place.icon, new google.maps.Size(71, 71),
				new google.maps.Point(0, 0), new google.maps.Point(17, 34),
				new google.maps.Size(35, 35));

				user_destination = place.geometry.location;
				setDesIconTextPos(image, user_destination, place.name);
				
				// filled back to user input text with formatted address
				input.value = place.name;
				// show map
				$("#map").css("visibility", "visible");
				$( "#post-form" ).submit();
			}
		}
    });

	$('#targetaddr').autocomplete({
		'source':JSON.parse(localStorage.getItem('targetaddr')),
		minLength:0,
		appendTo: "#form-search-id",
		'select': function (event, ui) {
			var value = (ui.item.value);
			$("#targetaddr").val(value);
			document.activeElement.blur();
			$('#post-form').submit();
		}
	}).data('ui-autocomplete')._renderItem = function (ul, item) { /* Added a clock icon from the history search of item list */
		return $('<li class="ui-menu-item-with-icon"></li>')
			.data("item.autocomplete", item)
			.append('<a><span class="glyphicon glyphicon-time fa-lg"></span>&nbsp;' + item.label + '</a>')
			.appendTo(ul);
	};

	$("#targetaddr").click(function(){
		if($(this).val()==""){
			if(localStorage.getItem('targetaddr')) {
				$(this).autocomplete("search","");
			}
		}
	});

	$("#targetaddr").on("input", function() {
		if(this.value!=""){
			$(this).autocomplete("disable");
		}
		else{
			$(this).autocomplete("enable");
			if(localStorage.getItem('targetaddr')) {
				$(this).autocomplete("search","");
			}
		}
	});

	// Submit post on submit
	$('#post-form').on('submit', function(event){
	    event.preventDefault();
	    $('#submit-btn').blur();
	    if($('#targetaddr').val()!=""){
	    	$('#submit-btn').attr("disabled", true);
	    	create_post(embed, csrf_token);
	    }
	    else{
	    	alert(gettext('Please input your destination.'));
	    }
	});

	if($("#navbar-toggle-id").is(":visible")){
		// disable scroll top button when keyboard show on smart phone
		$('#targetaddr').focusin(function() {
			$('#scrollup_icon').hide();
			if($(this).val()==""){
				if(localStorage.getItem('targetaddr')) {
					$(this).autocomplete("search","");
				}
			}
		});

		$( "#targetaddr" ).click(function() {
			$('#scrollup_icon').hide();
			if($(this).val()==""){
				if(localStorage.getItem('targetaddr')) {
					$(this).autocomplete("search","");
				}
			}
		});

		$( "#targetaddr" ).keypress(function() {
			$('#scrollup_icon').hide();
		});

		$('#targetaddr').focusout(function() {
			$('#scrollup_icon').show();
			$('#targetaddr').autocomplete("close");
		});

		$(window).scroll(function(){
			$('#scrollup_icon').show();
		})
	}

	if ($(window).width()< 768) {
		$("#image_container_1").removeAttr('onmouseover');
		$("#image_container_2").removeAttr('onmouseover');
		$("#image_container_3").removeAttr('onmouseover');
		$("#image_container_1").removeAttr('onmouseleave');
		$("#image_container_2").removeAttr('onmouseleave');
		$("#image_container_3").removeAttr('onmouseleave');
	}

	// Update FB/Google share URL
	$("#icoFacebook-id").attr("href", "https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2F"+location.host+"%2F");
	$("#icoTwitter-id").attr("href", "https://twitter.com/intent/tweet?text=http%3A%2F%2F"+location.host+"%2F");
	$("#icoGoogle-id").attr("href", "https://plus.google.com/share?url=http%3A%2F%2F"+location.host+"%2F");
	$("#icoLinkedin-id").attr("href", "https://www.linkedin.com/shareArticle?mini=true&url=http%3A%2F%2F"+location.host+"%2F&title=MRT%20SEARCH&summary=&source=");

	$('#section-search').fadeTo('slow', 0.3, function()
	{
		/*if(Math.random()>0.5) {
			$(this).css('background-image', "url(/static/img/banner/taipei.jpg)");
		}
		else {
			if(Math.random()>0.5) {
				$(this).css('background-image', "url(/static/img/banner/kaohsiung_1.jpg)");
			}
			else {*/
				$(this).css('background-image', "url(/static/img/banner/kaohsiung_2.jpg)");
				//$.loadmodal('/static/popup/maintain.html');
			/*}
		}*/
	}).delay(1000).fadeTo('slow', 1);			
    // auto change icon to top or down when user scroll html body
	$(window).scroll(function(){
		if ($(this).scrollTop() > 100) {
			$("#scroll_fa_icon").attr('class', 'fa fa-chevron-up');
		} else {
			$("#scroll_fa_icon").attr('class', 'fa fa-chevron-down');
		}
	});
	// customize the scroll button will be auto-changed to top or down
	$('.scrollup').click(function(){
		if ($(window).scrollTop() > 100) {
			$("html, body").animate({ scrollTop: 0 }, 1000);
			return false;
		} else {
			$("html, body").animate({ scrollTop: $('#footer').offset().top }, 1000);
			return false;
		}
	});

	$("#share-link").click(function() {
		copyToClipboard(document.getElementById('share-url-textbox'));
	});
	
	$("#share-url-btn").click(function() {
		copyToClipboard(document.getElementById('share-url-textbox'));
	});

	$("#embed-code-btn").click(function() {
		copyToClipboard(document.getElementById('embed-code-textbox'));
	});

	(adsbygoogle = window.adsbygoogle || []).push({});
	$("#gads-float-div").hide();

	if(targetaddr)	{
		$("#targetaddr").val(targetaddr);
		$("#post-form").submit();
		if(embed == "true") {
			$("#info_section").css("padding-top", "0px");
			$("#map-outer").css("margin-bottom", "60px");
			$("#section-services").hide();
			$("#scrollup_icon").hide();
			$("#section-search").hide(); 
			$("#footer").hide();
			$("#map-outer").css("width","100%");
			$("#map-outer").css("margin-top","0px");
			$("#map-outer").css("margin-bottom", "0px");
			$("#map-outer").css("height","100vh");
			$("#share-link").css("visibility", "hide");
			$("#line-share-link").css("visibility", "hide");
			$("#icoGoToWebsite-id").attr("href", "http://"+location.host);
			$("#go-to-logo").css("visibility", "visible");
		}
	}
}

function setDesIconTextPos(icon, pos, address){
	if(map && user_destination_Marker){
		user_destination_Marker.setIcon(icon);     
		user_destination_Marker.setPosition(pos);
		// Enable to open info window when click marker
		user_destination_Marker.addListener('click', function() {
			des_infowindow.open(map, user_destination_Marker);
		});				

		if(des_infowindow){	
			des_infowindow.setContent(address);
			des_infowindow.open(map, user_destination_Marker);
		}
	}
}

// draw the routing path from MRT exit to destination 
function direction_route(origin, src_address, target, des_address, waypoints, distance, duration) {
	var bounds = new google.maps.LatLngBounds();
	var from_MRT_exit = new google.maps.LatLng(origin.split(",")[0],origin.split(",")[1]);
    var user_destination = new google.maps.LatLng(target.split(",")[0],target.split(",")[1]);
    var from_MRT_exit_ICON = new google.maps.MarkerImage(
        "/static/img/A_New.png",
        null, /* size is determined at runtime */
        null, /* origin is 0,0 */
        null, /* anchor is bottom center of the scaled image */
        new google.maps.Size(32, 32)
    );

    var user_destination_ICON = new google.maps.MarkerImage(
        "/static/img/B_New.png",
        null, /* size is determined at runtime */
        null, /* origin is 0,0 */
        null, /* anchor is bottom center of the scaled image */
        new google.maps.Size(32, 32)
    );						    

	if(map) {
		//set MRT exit marker text and icon
		//from_MRT_Marker.setIcon(from_MRT_exit_ICON);			     
		from_MRT_Marker.setPosition(from_MRT_exit);	
		from_MRT_Marker.addListener('click', function() {
			src_infowindow.open(map, from_MRT_Marker);
		});
		if(src_infowindow){	
			src_infowindow.setContent(src_address);
			src_infowindow.open(map, from_MRT_Marker);
		}

		if(des_address_string==null) {
			des_address_string = des_address;
		}
		setDesIconTextPos(user_destination_ICON, user_destination, des_address_string);

		var request = {
			origin: from_MRT_exit,
			destination: user_destination,
			travelMode: google.maps.TravelMode.WALKING
		};
		
		//"waypoints" which is the point must be passed is a value to decide how google to draw the route
		if (waypoints) {
			var arrPoint = waypoints.split("#");
	  
			var waypts = [];
			for (var i = 0; i < arrPoint.length; i++) {
					waypts.push({
							location: arrPoint[i],
							stopover: true
					});
			}

			request = {
				origin: from_MRT_exit,
				destination: user_destination,
				waypoints: waypts,                
				optimizeWaypoints: true,
				travelMode: google.maps.TravelMode.WALKING
			};
		}

		directionsDisplay.setMap(map);
		directionsService.route(request, function(response, status) {
			console.debug(response);
			if (status == google.maps.DirectionsStatus.OK) {
				directionsDisplay.setDirections(response);
				
				var key_ran = Math.ceil(Math.random()*2)-1;

				//add distance and duration on route path
				des_infowindow.setContent("<a href='https://maps.googleapis.com/maps/api/streetview?key="+browser_key[key_ran]+"&size=400x400&location="+target+"&heading=90&pitch=0.0' target='_blank'><img src='https://maps.googleapis.com/maps/api/streetview?key="+browser_key[key_ran]+"&size=200x200&location="+target+"&heading=90&pitch=0.0' /></a>"+"<br/>"+des_infowindow.getContent()+"<br/>"+gettext('distance')+":"+distance + gettext('m')+"<br>"+gettext('duration')+":" + duration);

				bounds = response.routes[0].bounds;

				// fit bounds to show all result
				window.setTimeout(function() {					
					bounds.extend(from_MRT_Marker.getPosition());
					bounds.extend(src_infowindow.getPosition());
					bounds.extend(user_destination_Marker.getPosition());
					bounds.extend(des_infowindow.getPosition());
					map.fitBounds(bounds);
					map.setCenter(bounds.getCenter());								
				}, 500);

				$("#share-link").css("visibility", "visible");
				//$("#share-info").hide();
				$("#map").css("visibility", "visible");
				$("#map-outer").css("margin-bottom", "0px");
				$('#share-info').show();

				$("#share-url-textbox").val("http://"+location.host+"/?targetaddr="+encodeURIComponent($('#targetaddr').val()));
				$("#line-share-link span a").attr("href","http://line.me/R/msg/text/?"+encodeURIComponent(gettext('This is the title.')+" ")+encodeURIComponent($("#share-url-textbox").val()));
				$("#line-share-link").css("visibility", "visible");
				$("#ico-location-arrow-id").attr("href","http://maps.google.com/maps?saddr="+from_MRT_exit+"&daddr="+user_destination);
				$("#route-link").css("visibility", "visible");
				// set embed code to textarea
				$("#embed-code-textbox").val("<iframe width='640' height='480' src='http://"+location.host+"/?targetaddr="+encodeURIComponent($('#targetaddr').val())+"&embed=true'></iframe>");

				$("#gads-float-div").show();
			}
		});
	  var service = new google.maps.places.PlacesService(map);
	  service.nearbySearch({
		location: user_destination,
		radius: 100,
		types: ['food']
	  }, callback);
	}
}

// copy share link to clipboard
function copyToClipboard(obj){
	//obj.style.visibility="visible";

	// set share url to hidden input text
	//obj.value="http://"+location.host+"/?targetaddr="+encodeURIComponent($('#targetaddr').val());

	// select focus on input text
	var currentFocus = document.activeElement;
	obj.focus();
	obj.setSelectionRange(0, obj.value.length);
   	
   	//copy the selection
   	var succeed;
    try {
    	succeed = document.execCommand("copy");
    } catch(e) {
    	// if failed, user need to copy it manually.
    	succeed = false;
    }

    if(succeed){
    	alert(gettext('share url copy complete'));
    } else {
    	window.prompt(gettext('copy share url manually'), obj.value);
    }
}

var taipei_track_color = [
	"#c38c31",
    "#e3002b",
    "#01885a",
    "#f8b51d",
    "#0070bc"
];

var taipei_track_name = [
	gettext('wenhu'), 
    gettext('tamsui-xinyi'), 
    gettext('songshan-xindian'), 
    gettext('zhonghe-xinlu'), 
    gettext('bannan') 
];

var kaohsiung_track_color = [
	"#de005d",
    "#f47b0f"
];			

var kaohsiung_track_name = [
	gettext('kao-red-line'), 
    gettext('kao-orange-line')
];			

// AJAX for posting
function create_post(embed, csrf_token) {
    //console.log("create post is working!") // sanity check
	History.pushState({state:1, targetaddr:$('#targetaddr').val()}, gettext('This is the title.'), "?targetaddr="+$('#targetaddr').val()); // logs {state:1}, "State 1", "?state=1"
    $.ajax({
        url : "result/", // the endpoint
        type : "GET", // http method
        dataType: "json",
        data : { csrfmiddlewaretoken: csrf_token, targetaddr : encodeURIComponent($('#targetaddr').val()) }, // data sent with the post request
		beforeSend: function() { $("#loadingModal").modal("show"); }, // show loading page before sending query request to server
		complete: function() { $("#loadingModal").modal("hide"); }, // hide loading page after user gets the query result
        // handle a successful response
        success : function(json) {
            //$('#post-text').val(''); // remove the value from the input
            console.log(json.final_closest_lat_lng); // log the returned json to the console
            console.log("success"); // another sanity check
			if(json.error){
				// show error message
				alert(json.error);
			}
			else{
				console.log("<p><p>"+gettext('where you want to go is')+"\""+$('#targetaddr').val()+"\"</p></p>");
				SaveDataToLocalStorage($('#targetaddr').val());
				$("#track_value").text("");
				var track_value_str = "";
				if (json.track_id) {
					var track_id_array = json.track_id.split("#");
					des_address_string = json.target_adress;
					for (var i = 0; i < track_id_array.length; i++) {
						if(json.area_indicator=="台北") {
							track_value_str = track_value_str+"<div class='line-number-style' style='background-color:"+taipei_track_color[track_id_array[i]-1]+"'>"+track_id_array[i]+"</div>";
						}
						else if(json.area_indicator=="高雄") {
							track_value_str = track_value_str+"<div class='line-number-style' style='background-color:"+kaohsiung_track_color[track_id_array[i]-1]+"'>"+track_id_array[i]+"</div>";
						}
					}
					track_value_str = track_value_str+"<div class='div-float-left'>";
					for (var i = 0; i < track_id_array.length; i++) {
						if(json.area_indicator=="台北") {
							track_value_str = track_value_str+"<font class='line-style'>"+taipei_track_name[track_id_array[i]-1]+"</font></b>";
						}
						else if(json.area_indicator=="高雄") {
							track_value_str = track_value_str+"<font class='line-style'>"+kaohsiung_track_name[track_id_array[i]-1]+"</font></b>";
						}
					}
					track_value_str = track_value_str+"<br/>";
					for (var i = 0; i < track_id_array.length; i++) {
						if(json.area_indicator=="台北") {
							track_value_str = track_value_str+"<hr class='line-style' style='border-color:"+taipei_track_color[track_id_array[i]-1]+"'>";
						}
						else if(json.area_indicator=="高雄") {
							track_value_str = track_value_str+"<hr class='line-style' style='border-color:"+kaohsiung_track_color[track_id_array[i]-1]+"'>";
						}
					}

					track_value_str = track_value_str+"</div>";
					$("#track_value").append(track_value_str);

					var pct = 100/track_id_array.length;
					//var font_size = parseInt($("font.line-style").css("font-size"))/(track_id_array.length-(0.5*(track_id_array.length-1)));
					$("font.line-style").css("width", pct+"%");
					$("font.line-style").css("font-size", "16px");
					$("hr.line-style").css("width", "50%");
					$("#track_value").css("padding-right", "0px");
					if(track_id_array.length == 1){
						$("font.line-style").css("font-size", "18px");
						$("hr.line-style").css("margin-left", "25%");
					} else{
						$("div.div-float-left").css("width", "70%");
					}
				}
				if (json.closest_name) {
					var closest_name_array = json.closest_name.split("#");
					if(closest_name_array.length > 1 ){
						if($("#current_language").val() == "zh-tw"){
							$("#closest_name").text(closest_name_array[0]);
						} else if($("#current_language").val() == "en"){
							$("#closest_name").text(closest_name_array[1]);
						}
					} else{
						$("#closest_name").text(json.closest_name);
					}
					json.closest_name = $("#closest_name").text();
				}
				if (json.closest_number) {
					var closest_number_array = json.closest_number.split("#");
					if(closest_number_array.length > 1 ){
						if($("#current_language").val() == "zh-tw"){
							$("#closest_number").text(closest_number_array[0]);
						} else if($("#current_language").val() == "en"){
							$("#closest_number").text(closest_number_array[1]);
						}
					} else{
						$("#closest_number").text(json.closest_number);
					}
					json.closest_number = $("#closest_number").text();
				}
				$("#w_dis_closest_lat_lng").text(json.w_dis_closest_lat_lng+gettext('m'));
				$("#w_sec_closest_lat_lng").text(formatSeconds(json.w_sec_closest_lat_lng));
				if(embed != "true") {
					$("#info_section").show();
				}
				$('html,body').animate({scrollTop: $("#track_value").offset().top},'slow');
				direction_route(json.final_closest_lat_lng, json.closest_name+" "+json.closest_number+gettext('number_exit'), json.resovle_lat_lng, $('#targetaddr').val(), json.waypoint_lat_lng, json.w_dis_closest_lat_lng, formatSeconds(json.w_sec_closest_lat_lng));
			}
			$('#submit-btn').attr("disabled", false);
        },

        // handle a non-successful response
        error : function(xhr,errmsg,err) {
			$('#submit-btn').attr("disabled", false);
			alert(xhr.responseText);
            console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
        }
    });
};

function callback(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);
    }
  }
}

function createMarker(place) {
  var placeLoc = place.geometry.location;
  var marker = new google.maps.Marker({
    map: map,
	icon: "/static/img/EAT-PIN.png",
    position: place.geometry.location
  });

  google.maps.event.addListener(marker, 'click', function() {
	var ratingStr = "";
	var ratingFloat = parseFloat(place.rating);
	for(i=0;i<ratingFloat;i++) {
		ratingStr += "<i class='fa fa-star fa-lg' aria-hidden='true'></i>";
		if((i+0.5) > ratingFloat) {
			ratingStr += "<i class='fa fa-star-half-o fa-lg' aria-hidden='true'></i>";
			break;
		}
	}
    food_infowindow.setContent(place.name+"<br/>"+place.vicinity+"<br/>"+ratingStr);
    food_infowindow.open(map, this);
  });
}

function resetTabs(){
    $("#content > div").hide(); //Hide all content
    $("#tabs a").attr("id",""); //Reset id's      
}

// format time to hh:mm:ss
function formatSeconds(value) {
    var theTime = parseInt(value);// 蝘?
    var theTime1 = 0;// ??
    var theTime2 = 0;// 撠
    if(theTime > 60) {
        theTime1 = parseInt(theTime/60);
        theTime = parseInt(theTime%60);
        if(theTime1 > 60) {
        	theTime2 = parseInt(theTime1/60);
        	theTime1 = parseInt(theTime1%60);
        }
    }
    var result = ""+parseInt(theTime)+gettext('s');
    if(theTime1 > 0) {
    	result = ""+parseInt(theTime1)+gettext('min')+result;
    }
    if(theTime2 > 0) {
    	result = ""+parseInt(theTime2)+gettext('hour')+result;
    }
    return result;
}

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-71016232-1', 'auto');
ga('send', 'pageview');
//]]> 