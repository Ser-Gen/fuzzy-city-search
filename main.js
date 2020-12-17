var main = document.querySelector('.CitySelectWindow__item');
var parent = document.querySelector('.CitySelectSearchResult');

parent.hidden = true;

[].forEach.call(document.querySelectorAll('.CitySelectList__item'), function (item) {
	var clone = item.cloneNode(true);

	parent.appendChild(clone);
})

var parent = document.querySelector('.CitySelectSearchResult');
var items = [].slice.call(document.querySelectorAll('.CitySelectSearchResult .CitySelectList__item'));
var onInputDebounced = debounce(onInput, 200);

searchCityField.oninput = onInputDebounced;


function onInput () {
	var val = this.value;

	if (val) {
		val = val.toLowerCase();
		main.hidden = true;
		parent.hidden = false;
		sortNodes(items, parent, {
			map: function (item) {
				var content = item.querySelector('.CitySelectList__link').textContent.toLowerCase();
		
				item._th_sort_weight =
					Math.round(content.length / levenshteinWeighted(val, content) * 100)
					+ Math.round(content.length / levenshteinWeighted(kbLayoutSwapper(val), content) * 100)
					+ Math.round(content.length / levenshteinWeighted(val, rusToLatin(content)) * 100)
				
				try {
					item.querySelector('.CitySelectList__region').setAttribute('data-kek', item._th_sort_weight);
				} catch (e) {}
		
				return item.parentNode.removeChild(item);
			},
			compare: function (a, b) {
				return b._th_sort_weight - a._th_sort_weight;
			}
		});
	}
	else {
		main.hidden = false;
		parent.hidden = true;
		sortNodes(items, parent);
	}
}



// https://stackoverflow.com/questions/22308014/damerau-levenshtein-distance-implementation
// https://jsfiddle.net/SerGen/xzkgyg0y/
function levenshteinWeighted (seq1, seq2) {
	var len1 = seq1.length;
	var len2 = seq2.length;
	var i, j;
	var dist;
	var ic, dc, rc;
	var last, old, column;

	var weighter={
		insert: function(c) { return .5; },
		delete: function(c) { return .5; },
		replace: function(c, d) { return 1; }
	};

	if (len1 == 0 || len2 == 0) {
		dist = 0;
		while (len1)
			dist += weighter.delete(seq1[--len1]);
		while (len2)
			dist += weighter.insert(seq2[--len2]);

		return dist;
	}

	column = [];
	column[0] = 0;

	for (j = 1; j <= len2; ++j)
		column[j] = column[j - 1] + weighter.insert(seq2[j - 1]);

	for (i = 1; i <= len1; ++i) {
		last = column[0];
		column[0] += weighter.delete(seq1[i - 1]);

		for (j = 1; j <= len2; ++j) {
			old = column[j];

			if (seq1[i - 1] == seq2[j - 1]) {
				column[j] = last;
			} 
			else {
				ic = column[j - 1] + weighter.insert(seq2[j - 1]);
				dc = column[j] + weighter.delete(seq1[i - 1]);
				rc = last + weighter.replace(seq1[i - 1], seq2[j - 1]);
				column[j] = ic < dc ? ic : (dc < rc ? dc : rc);
			}

			last = old;
		}
	}

	dist = column[len2];

	return dist;
}

// https://stackoverflow.com/questions/282670/easiest-way-to-sort-dom-nodes
function sortNodes (nodes, parent, options) {
	if (typeof options === 'undefined') {
		options = {};
	}

	if (typeof options.map === 'undefined') {
		options.map = function (node) {
			return node.parentNode.removeChild(node);
		}
	}

	if (typeof options.compare === 'undefined') {
		options.compare = function (a, b) {
			if (a.textContent > b.textContent) return 1;
			if (a.textContent < b.textContent) return -1;

			return 0;
		}
	}

	nodes
		.map(options.map)
		.sort(options.compare)
		.forEach(function (node) {
			parent.appendChild(node);
		})
}

// переключатель раскладки клавиатуры
// регистронезависимый
function kbLayoutSwapper (str) {
	if (!str) { return ''; }

	str = str.split('');
	
	var items = [
		"q", "й", "w", "ц", "e", "у", "r", "к", "t", "е", "y", "н", "u", "г", "i", "ш", "o", "щ", "p", "з", "[", "х", "]", "ъ", "a", "ф", "s", "ы", "d", "в", "f", "а", "g", "п", "h", "р", "j", "о", "k", "л", "l", "д", ";", "ж", "'", "э", "z", "я", "x", "ч", "c", "с", "v", "м", "b", "и", "n", "т", "m", "ь", ",", "б", ".", "ю", "/", "."
	];
	
	for (var i = 0; i < str.length; i++) {
		var char = str[i].toLowerCase();
		var dir = 1;
		var index = items.indexOf(char);
		
		if (index < 0) {
			continue;
		}
		
		if (char.match(/[А-я\.]/)) {
			dir = -1;
		}
		
		str[i] = items[index + dir];
	}
	
	return str.join('');
}

// перевод на транслит
// https://gist.github.com/diolavr/d2d50686cb5a472f5696
function rusToLatin (str) {
	var ru = {
		'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 
		'е': 'e', 'ё': 'e', 'ж': 'j', 'з': 'z', 'и': 'i', 
		'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 
		'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 
		'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 
		'щ': 'shch', 'ы': 'y', 'э': 'e', 'ю': 'u', 'я': 'ya'
	};
	var n_str = [];
	
	str = str.replace(/[ъь]+/g, '').replace(/й/g, 'i');
	
	for (var i = 0; i < str.length; ++i) {
		n_str.push(
			ru[str[i]]
			|| ru[str[i].toLowerCase()] == undefined && str[i]
			|| ru[str[i].toLowerCase()].replace(/^(.)/, function ( match ) { return match.toUpperCase() })
		);
	}
	
	return n_str.join('');
}


// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce (func, wait, immediate) {
	var timeout;

	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		}
		var callNow = immediate && !timeout;

		clearTimeout(timeout);
		timeout = setTimeout(later, wait || 500);

		if (callNow) func.apply(context, args);
	}
}
