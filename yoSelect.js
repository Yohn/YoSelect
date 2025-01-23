class YoSelect {
	constructor(element, config = {}) {
		// Enhanced default configuration
		this.defaultConfig = {
			search: false,                    // Enable search functionality
			creatable: false,                 // Allow creating new options
			clearable: false,                 // Allow clearing selection
			maxHeight: '360px',              // Max height of dropdown
			classTag: '',                    // Custom class for tags
			searchPlaceholder: 'Search..',    // Search input placeholder
			noResultsPlaceholder: 'No results found',  // No results message
			addOptionPlaceholder: 'Press Enter to add "<strong>[searched-term]</strong>"',
			itemClass: '',                   // Custom class for items
			maxItems: null,                  // Maximum number of selections (multiple)
			minItems: null,                  // Minimum number of selections (multiple)
			maxCreateLength: 100,            // Maximum length for created options
			minCreateLength: 1,              // Minimum length for created options
			sortSelected: false,             // Sort selected items
			searchMinLength: 0,              // Minimum length before search starts
			searchDelay: 150,               // Debounce delay for search
			closeOnSelect: true,            // Close dropdown after selection
			allowHTML: false,               // Allow HTML in options
			disabled: false,                // Disable the select
			placeholder: 'Select option',    // Placeholder text
			dropdownPosition: 'auto',       // Dropdown position (auto, top, bottom)
			imageWidth: '24px',             // Width for option images
			imageHeight: '24px',            // Height for option images
			customClasses: {                // Custom classes for elements
				container: '',
				dropdown: '',
				option: '',
				selected: '',
				search: '',
				badge: ''
			},
			callbacks: {                    // Callback functions
				onInit: null,
				onChange: null,
				onOpen: null,
				onClose: null,
				onSearch: null,
				onCreate: null,
				onClear: null
			}
		};

		// Validate and merge configurations
		this.options = this.#mergeConfig(this.defaultConfig, config);

		// Validate element
		if (!(element instanceof HTMLSelectElement)) {
			throw new Error('YoSelect: First argument must be a SELECT element');
		}

		this.element = element;
		this.#setupProperties();
		this.#createElements();
		this.init();

		// Call onInit callback if defined
		this.#triggerCallback('onInit');

		// Keep original select and hide it instead of removing it
		this.originalSelect = element;
		this.originalSelect.style.display = 'none';
		this.originalSelect.setAttribute('tabindex', '-1');

		// Insert our custom select after the original instead of replacing it
		this.originalSelect.parentNode.insertBefore(this.details, this.originalSelect.nextSibling);
	}

	// Private methods (using # prefix)
	#setupProperties() {
		this.isMultiple = this.element.hasAttribute('multiple');
		this.isSearchable = this.element.hasAttribute('data-yo-search') || this.options.search;
		this.isCreatable = this.element.hasAttribute('data-yo-creatable') || this.options.creatable;
		this.isClearable = this.element.hasAttribute('data-yo-clearable') || this.options.clearable;
		this.isDisabled = this.element.disabled || this.options.disabled;
		this.selectedValues = new Set();
		this.currentFocusIndex = -1;
		this.searchInput = null;
		this.searchTimeout = null;
	}

	#createElements() {
		// Create base elements with enhanced security
		this.details = document.createElement('details');
		this.details.className = `dropdown yo-select ${this.options.customClasses.container}`.trim();

		if (this.isDisabled) {
			this.details.setAttribute('disabled', '');
		}

		this.summary = document.createElement('summary');

		this.selectedContainer = document.createElement('div');
		Object.assign(this.selectedContainer.style, {
			display: 'flex',
			gap: '0.5rem',
			flexWrap: 'wrap',
			alignItems: 'center'
		});

		this.ul = document.createElement('ul');
		Object.assign(this.ul.style, {
			maxHeight: this.options.maxHeight,
			overflowY: 'auto'
		});

		// Setup dropdown positioning
		this.#setupDropdownPosition();

		// Add summary and ul to details
		this.details.appendChild(this.summary);
		this.details.appendChild(this.ul);
	}

	#setupDropdownPosition() {
		if (this.options.dropdownPosition !== 'auto') {
			this.details.dataset.position = this.options.dropdownPosition;
		} else {
			// Calculate position based on viewport
			window.addEventListener('scroll', this.#updateDropdownPosition.bind(this), { passive: true });
			window.addEventListener('resize', this.#updateDropdownPosition.bind(this), { passive: true });
		}
	}

	#updateDropdownPosition() {
		if (this.details.hasAttribute('open')) {
			const rect = this.details.getBoundingClientRect();
			const spaceBelow = window.innerHeight - rect.bottom;
			const spaceAbove = rect.top;

			this.details.dataset.position = spaceBelow < 100 && spaceAbove > spaceBelow ? 'top' : 'bottom';
		}
	}

	// Enhanced search functionality with debounce
	#handleSearch(searchTerm) {
		clearTimeout(this.searchTimeout);

		this.searchTimeout = setTimeout(() => {
			const normalizedTerm = searchTerm.toLowerCase();

			if (normalizedTerm.length < this.options.searchMinLength) {
				return;
			}

			Array.from(this.ul.children).forEach(li => {
				if (li.contains(this.searchInput)) return;

				const text = li.textContent.toLowerCase();
				const matches = text.includes(normalizedTerm);
				li.style.display = matches ? '' : 'none';
			});

			this.#handleCreatableOption(normalizedTerm);
			this.#triggerCallback('onSearch', normalizedTerm);
		}, this.options.searchDelay);
	}

	#handleCreatableOption(searchTerm) {
		if (!this.isCreatable || !searchTerm) return;

		const existingCreateOption = this.ul.querySelector('.create-option');
		if (existingCreateOption) {
			existingCreateOption.remove();
		}

		if (searchTerm.length < this.options.minCreateLength ||
			searchTerm.length > this.options.maxCreateLength) {
			return;
		}

		const hasMatch = Array.from(this.ul.children).some(li =>
			!li.contains(this.searchInput) &&
			li.textContent.toLowerCase() === searchTerm.toLowerCase()
		);

		if (!hasMatch) {
			const createLi = document.createElement('li');
			createLi.className = 'create-option';
			const createLabel = document.createElement('label');
			createLabel.innerHTML = this.options.allowHTML ?
				this.options.addOptionPlaceholder.replace('[searched-term]', searchTerm) :
				this.options.addOptionPlaceholder.replace('[searched-term]', this.#escapeHTML(searchTerm));
			createLi.appendChild(createLabel);
			this.ul.appendChild(createLi);
		}
	}

	// Security: Escape HTML content
	#escapeHTML(str) {
		const div = document.createElement('div');
		div.textContent = str;
		return div.innerHTML;
	}

	// Trigger callback if defined
	#triggerCallback(name, ...args) {
		if (typeof this.options.callbacks[name] === 'function') {
			this.options.callbacks[name].apply(this, args);
		}
	}

	// Public methods
	getValue() {
		if (this.isMultiple) {
			return Array.from(this.selectedContainer.children).map(badge => ({
				value: badge.dataset.value,
				text: badge.textContent.replace('×', '').trim()
			}));
		}
		return {
			text: this.summary.textContent,
			value: this.ul.querySelector('input:checked')?.value
		};
	}

	setValue(values) {
		if (Array.isArray(values)) {
			values.forEach(value => {
				const input = this.ul.querySelector(`input[value="${value}"]`);
				if (input) {
					input.checked = true;
					this.updateSelection(input);
				}
			});
		} else if (values) {
			const input = this.ul.querySelector(`input[value="${values}"]`);
			if (input) {
				input.checked = true;
				this.updateSelection(input);
			}
		}
	}

	clear() {
		if (this.isMultiple) {
			this.selectedContainer.innerHTML = '';
			this.selectedValues.clear();
			this.ul.querySelectorAll('input[type="checkbox"]')
				.forEach(input => input.checked = false);
			// Clear original select
			Array.from(this.originalSelect.options).forEach(option => {
				option.selected = false;
			});
		} else {
			this.summary.textContent = this.options.placeholder;
			this.ul.querySelectorAll('input[type="radio"]')
				.forEach(input => input.checked = false);
			// Clear original select
			this.originalSelect.value = '';
		}
		this.#triggerCallback('onClear');
	}

	disable() {
		this.isDisabled = true;
		this.details.setAttribute('disabled', '');
		this.ul.querySelectorAll('input').forEach(input => input.disabled = true);
	}

	enable() {
		this.isDisabled = false;
		this.details.removeAttribute('disabled');
		this.ul.querySelectorAll('input').forEach(input => input.disabled = false);
	}

	destroy() {
		window.removeEventListener('scroll', this.#updateDropdownPosition);
		window.removeEventListener('resize', this.#updateDropdownPosition);

		// Show original select and remove our custom select
		this.originalSelect.style.display = '';
		this.originalSelect.removeAttribute('tabindex');
		this.details.remove();
	}

	focusItem(index) {
		const items = Array.from(this.ul.children).filter(li => {
			return li.style.display !== 'none' && !li.contains(this.searchInput);
		});

		// Remove focus from all items
		items.forEach(item => item.classList.remove('active'));

		if (index >= 0 && index < items.length) {
			this.currentFocusIndex = index;
			const item = items[index];
			item.classList.add('active');
			item.scrollIntoView({ block: 'nearest' });
		}
	}

	createNewOption(value) {
		const li = document.createElement('li');
		const label = document.createElement('label');
		const input = document.createElement('input');

		input.type = this.isMultiple ? 'checkbox' : 'radio';
		input.name = this.element.name || 'select-option';
		input.value = value.toLowerCase().replace(/\s+/g, '-');
		input.hidden = true;

		label.appendChild(input);
		label.appendChild(document.createTextNode(value));
		li.appendChild(label);
		this.ul.appendChild(li);

		// Select the new option
		input.checked = true;
		this.updateSelection(input);

		// Clear search
		if (this.searchInput) {
			this.searchInput.value = '';
			// Trigger input event to update filtered items
			this.searchInput.dispatchEvent(new Event('input'));
		}
	}

	updateSelection(input) {
		const label = input.closest('label');
		const text = label.textContent;
		const img = label.querySelector('img')?.cloneNode(true);

		if (this.isMultiple) {
			if (input.checked) {
				// Check max items limit
				if (this.options.maxItems && this.selectedValues.size >= this.options.maxItems) {
					input.checked = false;
					return;
				}

				if (this.selectedValues.has(input.value)) return;
				this.selectedValues.add(input.value);

				const badge = document.createElement('span');
				badge.dataset.value = input.value;
				badge.className = 'yo-badge ' + this.options.customClasses.badge;

				if (img) {
					img.style.width = this.options.imageWidth;
					img.style.height = this.options.imageHeight;
					badge.appendChild(img);
				}

				badge.appendChild(document.createTextNode(text));

				const removeBtn = document.createElement('button');
				removeBtn.innerHTML = '×';
				removeBtn.style.marginLeft = '0.25rem';
				removeBtn.onclick = (e) => {
					e.stopPropagation();
					badge.remove();
					this.selectedValues.delete(input.value);
					input.checked = false;
					this.#triggerCallback('onChange', this.getValue());
				};

				badge.appendChild(removeBtn);

				if (this.options.sortSelected) {
					// Insert in alphabetical order
					const badges = Array.from(this.selectedContainer.children);
					const insertIndex = badges.findIndex(b => b.textContent.localeCompare(text) > 0);
					if (insertIndex === -1) {
						this.selectedContainer.appendChild(badge);
					} else {
						this.selectedContainer.insertBefore(badge, badges[insertIndex]);
					}
				} else {
					this.selectedContainer.appendChild(badge);
				}
			} else {
				const badge = this.selectedContainer.querySelector(`[data-value="${input.value}"]`);
				if (badge) {
					badge.remove();
					this.selectedValues.delete(input.value);
				}
			}

			// Check min items requirement
			if (this.options.minItems && this.selectedValues.size < this.options.minItems) {
				this.details.classList.add('invalid');
			} else {
				this.details.classList.remove('invalid');
			}
		} else {
			this.summary.innerHTML = '';
			if (img) {
				img.style.width = this.options.imageWidth;
				img.style.height = this.options.imageHeight;
				this.summary.appendChild(img);
			}
			this.summary.appendChild(document.createTextNode(text || this.options.placeholder));

			if (this.options.closeOnSelect) {
				this.details.removeAttribute('open');
			}
		}

		// Sync with original select
		if (this.isMultiple) {
			// Update all options in original select
			Array.from(this.originalSelect.options).forEach(option => {
				option.selected = this.selectedValues.has(option.value);
			});
		} else {
			this.originalSelect.value = input.value;
		}

		// Dispatch change event on original select
		this.originalSelect.dispatchEvent(new Event('change', { bubbles: true }));

		this.#triggerCallback('onChange', this.getValue());
	}

	init() {
		this.buildOptionsList();
		this.setupSearchIfNeeded();
		this.setupEventListeners();
		this.initializeSummary();
	}

	buildOptionsList() {
		// Convert options to list items
		Array.from(this.element.options).forEach(option => {
			// Skip empty value options unless it's explicitly a placeholder
			if (!option.value && !option.hasAttribute('data-placeholder')) {
				return;
			}
			const li = document.createElement('li');
			const label = document.createElement('label');

			// Add disabled state for empty values
			if (!option.value) {
				li.classList.add('placeholder');
				label.classList.add('disabled');
			}

			if (this.isMultiple) {
				const checkbox = document.createElement('input');
				checkbox.type = 'checkbox';
				checkbox.name = this.element.name || 'select-option';
				checkbox.value = option.value;
				checkbox.hidden = true;
				checkbox.disabled = !option.value; // Disable empty values
				label.appendChild(checkbox);
			} else {
				const radio = document.createElement('input');
				radio.type = 'radio';
				radio.hidden = true;
				radio.name = this.element.name || 'select-option';
				radio.value = option.value;
				radio.disabled = !option.value; // Disable empty values
				label.appendChild(radio);
			}

			if (option.dataset.yoImg) {
				const img = document.createElement('img');
				img.src = option.dataset.yoImg;
				img.style.width = '24px';
				img.style.height = '24px';
				img.style.marginRight = '0.5rem';
				label.appendChild(img);
			}

			label.appendChild(document.createTextNode(option.text));
			li.appendChild(label);
			this.ul.appendChild(li);
		});
	}

	setupSearchIfNeeded() {
		if (this.isSearchable) {
			// Create search container
			const searchLi = document.createElement('li');
			searchLi.className = 'search-container ' + this.options.customClasses.search;

			// Create and setup search input
			this.searchInput = document.createElement('input');
			this.searchInput.type = 'search';
			this.searchInput.placeholder = this.options.searchPlaceholder;
			this.searchInput.className = 'search-input';

			// Add search icon if specified
			if (this.options.searchIcon) {
				const searchIcon = document.createElement('span');
				searchIcon.className = 'search-icon';
				searchIcon.innerHTML = this.options.searchIcon;
				searchLi.appendChild(searchIcon);
			}

			searchLi.appendChild(this.searchInput);
			this.ul.insertBefore(searchLi, this.ul.firstChild);

			// Enhanced search functionality with debounce
			let searchTimeout;
			this.searchInput.addEventListener('input', (e) => {
				clearTimeout(searchTimeout);

				searchTimeout = setTimeout(() => {
					const searchTerm = e.target.value.toLowerCase().trim();
					let hasResults = false;

					// Skip search if term is shorter than minimum length
					if (searchTerm.length < this.options.searchMinLength) {
						Array.from(this.ul.children).forEach(li => {
							if (li === searchLi) return;
							li.style.display = '';
						});
						return;
					}

					// Perform search
					Array.from(this.ul.children).forEach(li => {
						if (li === searchLi) return;

						// Skip create option
						if (li.classList.contains('create-option')) {
							li.remove();
							return;
						}

						const text = li.textContent.toLowerCase();
						const matches = this.options.fuzzySearch ?
							this.#fuzzySearch(text, searchTerm) :
							text.includes(searchTerm);

						li.style.display = matches ? '' : 'none';
						if (matches) hasResults = true;
					});

					// Handle no results
					const noResultsEl = this.ul.querySelector('.no-results');
					if (!hasResults && searchTerm.length > 0) {
						if (!noResultsEl) {
							const noResults = document.createElement('li');
							noResults.className = 'no-results';
							noResults.textContent = this.options.noResultsPlaceholder;
							this.ul.appendChild(noResults);
						}
					} else if (noResultsEl) {
						noResultsEl.remove();
					}

					// Handle creatable option
					if (this.isCreatable && searchTerm) {
						this.#handleCreatableOption(searchTerm);
					}

					// Reset focus when search changes
					this.currentFocusIndex = -1;

					// Trigger search callback
					this.#triggerCallback('onSearch', {
						term: searchTerm,
						hasResults,
						resultsCount: this.ul.querySelectorAll('li:not(.search-container):not(.no-results):not([style*="display: none"])').length
					});
				}, this.options.searchDelay);
			});

			// Enhanced keyboard navigation
			this.searchInput.addEventListener('keydown', (e) => {
				const items = Array.from(this.ul.children).filter(li => {
					return li.style.display !== 'none' &&
						!li.contains(this.searchInput) &&
						!li.classList.contains('no-results');
				});

				switch (e.key) {
					case 'ArrowDown':
						e.preventDefault();
						this.focusItem(Math.min(this.currentFocusIndex + 1, items.length - 1));
						break;

					case 'ArrowUp':
						e.preventDefault();
						this.focusItem(Math.max(this.currentFocusIndex - 1, 0));
						break;

					case 'Enter':
						e.preventDefault();
						if (this.currentFocusIndex >= 0) {
							const focusedItem = items[this.currentFocusIndex];
							const input = focusedItem.querySelector('input');
							if (input) {
								input.checked = !input.checked;
								this.updateSelection(input);
							} else if (focusedItem.classList.contains('create-option')) {
								this.createNewOption(this.searchInput.value);
							}
						} else if (this.isCreatable && this.searchInput.value) {
							this.createNewOption(this.searchInput.value);
						}
						break;

					case 'Escape':
						e.preventDefault();
						this.details.removeAttribute('open');
						break;

					case 'Tab':
						if (this.options.closeOnTab) {
							this.details.removeAttribute('open');
						}
						break;
				}
			});

			// Prevent search input from triggering details close
			this.searchInput.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
			});

			// Optional: Clear search on dropdown close
			if (this.options.clearSearchOnClose) {
				this.details.addEventListener('toggle', () => {
					if (!this.details.open) {
						this.searchInput.value = '';
						this.searchInput.dispatchEvent(new Event('input'));
					}
				});
			}
		}
	}

	// Add this helper method for fuzzy search
	#fuzzySearch(text, search) {
		const searchLen = search.length;
		const textLen = text.length;
		if (searchLen > textLen) return false;
		if (searchLen === textLen) return search === text;

		next_char: for (let i = 0, j = 0; i < searchLen; i++) {
			const searchChar = search.charCodeAt(i);
			while (j < textLen) {
				if (text.charCodeAt(j++) === searchChar) {
					continue next_char;
				}
			}
			return false;
		}
		return true;
	}

	setupEventListeners() {
		// Event Listeners for changes
		this.ul.addEventListener('change', (e) => {
			const input = e.target;
			if (input.type === 'checkbox' || input.type === 'radio') {
				this.updateSelection(input);
				this.#triggerCallback('onChange', this.getValue());
			}
		});

		// Handle details open/close events
		this.details.addEventListener('toggle', (e) => {
			if (this.details.open) {
				this.#triggerCallback('onOpen');
				// Focus search input if exists
				if (this.searchInput) {
					this.searchInput.focus();
				}
			} else {
				this.#triggerCallback('onClose');
				// Clear search on close if configured
				if (this.searchInput && this.options.clearSearchOnClose) {
					this.searchInput.value = '';
					this.searchInput.dispatchEvent(new Event('input'));
				}
			}
		});

		// Close on outside click
		document.addEventListener('click', (e) => {
			if (this.details.open && !this.details.contains(e.target)) {
				this.details.removeAttribute('open');
			}
		});

		// Handle max items limit
		if (this.isMultiple && this.options.maxItems) {
			this.ul.addEventListener('change', (e) => {
				const checkedInputs = this.ul.querySelectorAll('input[type="checkbox"]:checked');
				if (checkedInputs.length > this.options.maxItems) {
					e.target.checked = false;
					this.updateSelection(e.target);
				}
			});
		}
	}

	initializeSummary() {
		// Initialize summary content
		if (this.isMultiple) {
			this.summary.appendChild(this.selectedContainer);
		} else {
			// Check for placeholder in the following order:
			// 1. data-placeholder attribute on selected option
			// 2. text of selected option (if has value)
			// 3. placeholder from config
			const defaultOption = this.element.options[this.element.selectedIndex];
			const placeholderText = defaultOption?.getAttribute('data-placeholder') ||
				(defaultOption?.value ? defaultOption.text : '') ||
				this.options.placeholder;

			if (defaultOption?.dataset.yoImg) {
				const img = document.createElement('img');
				img.src = defaultOption.dataset.yoImg;
				img.style.width = '24px';
				img.style.height = '24px';
				img.style.marginRight = '0.5rem';
				this.summary.appendChild(img);
			}

			this.summary.appendChild(document.createTextNode(placeholderText));

			// Add placeholder class if showing placeholder
			if (!defaultOption?.value) {
				this.summary.classList.add('placeholder');
			}
		}
	}

	#mergeConfig(defaultConfig, userConfig) {
		const merged = { ...defaultConfig };

		// Deep merge for nested objects
		for (const key in userConfig) {
			if (userConfig.hasOwnProperty(key)) {
				if (typeof userConfig[key] === 'object' && userConfig[key] !== null &&
					typeof defaultConfig[key] === 'object' && defaultConfig[key] !== null) {
					merged[key] = this.#mergeConfig(defaultConfig[key], userConfig[key]);
				} else {
					merged[key] = userConfig[key];
				}
			}
		}

		return merged;
	}
}

// Make YoSelect available globally with version info
window.YoSelect = Object.assign(YoSelect, {
	version: '1.1.0',
	defaults: YoSelect.prototype.defaultConfig
});