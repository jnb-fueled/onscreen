# OnScreen

A utility for efficiently tracking the position of elements through the viewport.


## Basic Usage

	// create an instance of the manager
	var onScreen = new OnScreen();

	// add an element
	onScreen.addItem(document.getElementById('my-element'));


By default the manager will track an item's position on page load, screen resizes, and page scrolling. If an item is detected as 'visible' it will have two classes applied to it:

1. js-screen[enter|leave]
2. js-screen[enter|leave]--[top[-right|-left]|right|bottom[-right|-left]|left|]

For example, an element entering the page as it scrolled in the usual manner will have the class `js-screenenter js-screenenter--bottom` applied. 

When the same element leaves the viewport, those classes will be replaced with `js-screenleave js-screenleave--top`.


## Advanced Usage

The `OnScreen` constructor can accept an object hash of options:

	var onScreen = new OnScreen({
		// an array or nodeList of elements broadcasting 'scroll' events
		scrollContainer: [document.body, document.documentElement, window],

		// boolean to enable/disable scroll tracking
		scroll: true,

		// boolean to enable/disable resize tracking
		resize: true,

		// boolean to enable/disable load tracking
		load: true
	});


Similarly when adding an item an object hash of options can be passed:

	onScreen.addItem(document.getElementById('my-element'), {
		// by default the viewport is the size of the actual viewport
		// however this can be modified with % or px values here
		screen: { top: 0, right: 0, bottom: 0, left: 0 },

		// by default the element is the tracked at it's actual size
		// however this can modified with % or px values here
		target: { top: 0, right: 0, bottom: 0, left: 0 },

		// the class to be added when an element enters the screen
		// this will also be applied suffixed with the side the action happened from
		screenEnterClass: 'js-screenenter',

		// the class to be added when an element leaves the screen
		// this will also be applied suffixed with the side the action happened from
		screenLeaveClass: 'js-screenleave',

		// callback function used when the element first enters the viewport
		// it will be passed an object containing 'side' and 'offset' information
		onScreenEnter: null,

		// callback function used when the element first leaves the viewport
		// it will be passed an object containing 'side' and 'offset' information
		onScreenLeave: null,

		// callback function used when the element moves through the viewport
		// it will be passed an object containing 'side' and 'offset' information
		onScreenMove: null,

		// boolean to enable/disable calling the move event even when the element is not visible
		fireScreenMoveOffScreen: false,

		// boolean to enable/disable tracking an elements position as it moves
		// disabling 'ScreenMove' will prevent any callbacks being fired as the element moves. 
		disableScreenMove: false,

		// additional data can be attached to the tracked element
		// it will be passed to any callbacks or event handlers
		data: undefined
	});


### Altering the enter and exit positions of an element and viewport

It will be common that you would want to only fire an event or add a class when an element reaches a specific point, and not just when the element first appears on the screen.

To do this you can 'modify' the tracked areas of both the screen and the target element:

	// track when the elements vertical 'middle' enters/leaves the viewport
	onScreen.addItem(document.getElementById('my-element'), {
		target: { top: 50%, bottom: 50% }
	});


	// track when the element enters/leaves the vertical 'middle' of the viewport
	onScreen.addItem(document.getElementById('my-element'), {
		screen: { top: 50%, bottom: 50% }
	});

	// track when the elements vertical 'middle' enters/leaves a quarter of the way into the viewport
	onScreen.addItem(document.getElementById('my-element'), {
		screen: { top: 25%, bottom: 25% },
		target: { top: 50%, bottom: 50% }
	});

	// unitless values (or those using unsupported units), are treated as pixel values
	// track when the element has reached 100 pixel into the viewport
	onScreen.addItem(document.getElementById('my-element'), {
		screen: { top: '100px', bottom: 100 }
	});

	// horizontal positions are also supported
	// track the horizontal center of the element
	onScreen.addItem(document.getElementById('my-element'), {
		target: { left: 50%, right: 50% }
	});


### The 'ScreenMove' callback

A 'ScreenMove' callback can be added using the property 'onScreenMove' in the options when adding an element to be tracked:

	//...
	
	onScreenMove: function(detail) {
		console.log(detail);
		/*
			{
				side: 'bottom',
				offset: {
					top: 0.5,
					right: 0.5,
					bottom: 0.5,
					left: 0.5
				},
				data: {
					//...
				}
			}
		*/
	}

	//...

The `offset` object contains a series of normalised values (0-1) that inform you how far through the viewport the element is in relation to that particular edge of the viewport (on it's logical axis - top/bottom = y, left/right = x)

The values can be used to 'scrub' through an animation sequence as the element moves through the viewport.

For example:

	onScreenMove: function(detail) {
		var offset = detail.offset.top; // normalised value between 0 and 1 when element is visible
		var position = offset * 100;

		element.style.opacity = offset;
		element.style.transform = 'translateY(' + position + '%)';
	}


### The 'ScreenEnter' and 'ScreenLeave' callbacks

Similar to 'ScreenMove' this callbacks are passed an object containing 'side' and 'offset' information.

These events will only fire once when enetering and once when leaving rather than continuously as 'ScreenMove' does.

Returning `false` from them will prevent the CSS classes from being added to the tracked element:

	//...
	
	onScreenEnter: function(detail) {
		// returning false will stop CSS classes being added to the element
		return false;
	}

	//...


#### Real events with 'addEventListener'

In addition to the callbacks that can be passed when adding an item, events can be attached in the usual way:

	element.addEventListener('screenenter', function(e) {
		console.log(e.detail);
		/*
			{
				side: 'bottom',
				offset: {
					top: 0.5,
					right: 0.5,
					bottom: 0.5,
					left: 0.5
				},
				data: {
					//...
				}
			}
		*/

		// calling 'preventDefault' will stop CSS classes being added to the element
		e.preventDefault();
	});


## Other methods

There are a few other methods that do what you would think they would:

	var onScreen = new OnScreen();

	// add an element
	onScreen.addItem(element);

	// update an elements options
	onScreen.updateItem(element, {
		disableScreenMove: true
	});

	// remove an element
	onScreen.removeItem(element);

	// check all elements, add classes and fire events right now
	// in case you missed the load event an want to fire it manually for example
	onScreen.update();

	// clear all tracked items from this instance
	onScreen.empty();

	// clear all tracked items from this instance and detach all events
	onScreen.dispose();



