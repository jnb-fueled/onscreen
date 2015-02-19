function OnScreen(options) {
	var self = this;

	var defaults = {
		scrollContainer: [document.body, document.documentElement, window],
		scroll: true,
		resize: true,
		load: true
	};

	self.options = mergeObjects(defaults, options || {});
	self.animFrame = null;
	self.items = [];
	self.map = {};
	self.update = update;
	self.util = {
		mergeObjects: mergeObjects
	};

	if (self.options.scroll) {
		self.options.scrollContainer.forEach(function(container) {
			container.addEventListener('scroll', update);
		});
	}

	if (self.options.resize) {
		window.addEventListener('resize', update);
	}

	if (self.options.load) {
		window.addEventListener('load', update);
	}


	function update() {
		if (!self.animFrame && self.items.length) {
			self.animFrame = requestAnimationFrame(process);
		}
	}


	function process() {
		self.animFrame = null;

		self.items.forEach(function (item) {

			var element = item.element;
			var options = item.options;

			var sideBefore = item.side;
			var isOnScreen = check(item);
			var sideAfter = item.side;
			var offset = item.offset;
			var detail = { side: isOnScreen ? sideBefore : sideAfter, offset: offset, data: options.data };

			var classes = element.getAttribute('class').match(new RegExp('\\b(' + options.screenEnterClass + '|' + options.screenLeaveClass + ')(-(-(top|bottom|left|right)){0,2})*', 'g')) || [];

			// Screen Enter
			if (isOnScreen) {

				// make sure to only fire once
				if (!item.onscreen) {
					item.onscreen = true;

					if (!dispatchEvent(element, 'screenenter', detail) ||
						(options.onScreenEnter && options.onScreenEnter.call(element, detail) === false)) {
						return
					}

					classes.forEach(function(item){
						element.classList.remove(item);
					});

					element.classList.add(options.screenEnterClass);
					element.classList.add(options.screenEnterClass + '--' + sideBefore);
				}
			}

			// Screen Leave
			else {

				// make sure to only fire once
				if (item.onscreen) {
					item.onscreen = false;

					if (!dispatchEvent(element, 'screenleave', detail) ||
						(options.onScreenLeave && options.onScreenLeave.call(element, detail) === false)) {
						return;
					}
					
					classes.forEach(function(item){
						element.classList.remove(item);
					});

					element.classList.add(options.screenLeaveClass);
					element.classList.add(options.screenLeaveClass + '--' + sideAfter);
				}
			}

			// Screen Move
			if (!options.disableScreenMove && (isOnScreen || options.fireScreenMoveOffScreen)) {
				
				if (!dispatchEvent(element, 'screenmove', detail) ||
					(options.onScreenMove && options.onScreenMove.call(element, detail) === false)) {
					return;
				}
			}
		});
	}


	function check(item) {
		var screenBounds = {
			top: 0,
			right: window.innerWidth,
			bottom: window.innerHeight,
			left: 0,
			width: window.innerWidth,
			height: window.innerHeight
		};

		var targetBounds = item.element.getBoundingClientRect();

		var screenRect = getModifiedRect(screenBounds, item.options.screen);
		var targetRect = getModifiedRect(targetBounds, item.options.target);

		var offset = {
			top: (targetRect.top - screenRect.top) / screenRect.height,
			right: -(targetRect.right - screenRect.right) / screenRect.width,
			bottom: -(targetRect.bottom - screenRect.bottom) / screenRect.height,
			left: (targetRect.left - screenRect.left) / screenRect.width
		};

		var side = [];

		// check side: top / bottom
		if (targetRect.bottom <= screenRect.top) {
			side[side.length] = 'top';
		}
		else if (targetRect.top >= screenRect.bottom) {
			side[side.length] = 'bottom';
		}

		// check side: left / right
		if (targetRect.right <= screenRect.left) {
			side[side.length] = 'left';
		}
		else if (targetRect.left >= screenRect.right) {
			side[side.length] = 'right';
		}

		// set offset
		item.offset = offset;

		// set side and return visibility
		if (side.length) {
			item.side = side.join('-');
			return false;
		}
		else {
			return true;
		}
	}


	function getModifiedRect(rect, mods) {
		var width = rect.width || (rect.right - rect.left);
		var height = rect.height || (rect.bottom - rect.top);
		var modRect = {};

		mods = mods || {};

		modRect.top = rect.top + (mods.top ? getModifierValue(mods.top, height) : 0);
		modRect.right = rect.right - (mods.right ? getModifierValue(mods.right, width) : 0);
		modRect.bottom = rect.bottom - (mods.bottom ? getModifierValue(mods.bottom, height) : 0);
		modRect.left = rect.left + (mods.left ? getModifierValue(mods.left, width) : 0);
		modRect.width = rect.right - rect.left;
		modRect.height = rect.bottom - rect.top;

		return modRect;
	}


	function getModifierValue(modifier, range) {
		return /\d%$/.test(modifier) ? (parseFloat(modifier) / 100) * range : parseFloat(modifier || 0);
	}


	function dispatchEvent(element, name, data) {
		var event;

		if (typeof CustomEvent === 'function') {
			event = new CustomEvent(name, {
				detail: data,
				bubbles: true,
				cancelable: true
			});
		}
		else {
			event = document.createEvent('CustomEvent');
			event.initCustomEvent(name, true, true, data);
		}

		return !!element.dispatchEvent(event);
	}


	function mergeObjects() {
		var destination = {};

		[].forEach.call(arguments, function(source) {
			for (var property in source) {
				if (source.hasOwnProperty(property)) {
					if (source[property] && {}.toString.call(source[property]) === '[object Object]') {
						destination[property] = mergeObjects(destination[property] || {}, source[property]);
					} else {
						destination[property] = source[property];
					}
				}
			}
		});

		return destination;
	};
}

OnScreen.prototype.addItem = function(element, options) {
	var defaults = {
		screen: { top: 0, right: 0, bottom: 0, left: 0 },
		target: { top: 0, right: 0, bottom: 0, left: 0 },
		screenEnterClass: 'js-screenenter',
		screenLeaveClass: 'js-screenleave',
		onScreenEnter: null,
		onScreenLeave: null,
		onScreenMove: null,
		fireScreenMoveOffScreen: false,
		disableScreenMove: false
	};

	var index = this.items.length;
	this.items[index] = { element: element, options: this.util.mergeObjects(defaults, options || {}), onscreen: false, side: 'bottom' };
	this.map[element] = index;

	return this.items[index];
};

OnScreen.prototype.updateItem = function(element, options) {
	var index = parseInt(this.map[element]);
	if (index >= 0 && index < this.items.length && this.items[index]) {
		this.items[index].options = options;
	}

	return this.items[index];
};

OnScreen.prototype.removeItem = function(element) {
	var index = parseInt(this.map[element]);
	if (index >= 0 && index < this.items.length) {
		this.items.splice(index, 1);
		this.map[element] = null;
		delete this.map[element];
	}
};

OnScreen.prototype.empty = function() {
	this.items = [];
	this.map = {};
};

OnScreen.prototype.dispose = function() {
	this.empty();

	if (this.options.scroll) {
		this.options.scrollContainer.forEach(function(container) {
			container.removeEventListener('scroll', this.update);
		}, this);
	}

	if (this.options.resize) {
		window.removeEventListener('resize', this.update);
	}

	if (this.options.load) {
		window.removeEventListener('load', this.update);
	}
};

