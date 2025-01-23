# YoSelect

YoSelect is a customizable select component that enhances the native HTML select element with features like searching, multiple selection, image support, and the ability to create new options.

## Installation
```
npm install @yohns/yoselect
```
1. Include the CSS and JS files in your HTML:
```html
<link rel="stylesheet" href="yoSelect.css">
<script src="yoSelect.js"></script>
```

## Basic Usage

```html
<select class="yoSelect">
<option value="">Select an option...</option>
<option value="1">Option 1</option>
<option value="2">Option 2</option>
</select>
<script>
const select = new YoSelect(document.querySelector('.yoSelect'));
</script>
```

## Features & Options

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `search` | boolean | false | Enables search functionality |
| `creatable` | boolean | false | Allows creating new options |
| `clearable` | boolean | false | Adds ability to clear selection |
| `searchPlaceholder` | string | 'Search...' | Placeholder text for search input |
| `noResultsPlaceholder` | string | 'No results found' | Text shown when no options match search |
| `addOptionPlaceholder` | string | 'Press Enter to add "[term]"' | Text shown when creating new option |
| `classTag` | string | '' | Custom CSS class for selected tags in multiple mode |
| `placeholder` | string | '' | Default placeholder text when no option is selected |

### HTML Attributes

You can configure YoSelect using either JavaScript options or data attributes:

```html
<select
class="yoSelect"
data-yo-search="true"
data-yo-clearable="true"
data-yo-creatable="true">
```

### Image Support

Add images to options using the `data-yo-img` attribute:

```html
<option value="us" data-yo-img="path/to/image.png">United States</option>
```

### Multiple Selection

Enable multiple selection using the `multiple` attribute:

```html
<select class="yoSelect" multiple>
<option value="1">Option 1</option>
<option value="2">Option 2</option>
</select>
```
### Searchable Select

Enable search functionality:
```html
<select class="yoSelect" data-yo-search="true">
<!-- options -->
</select>
<!-- or via JavaScript -->
<script>
new YoSelect(element, {
search: true,
searchPlaceholder: 'Custom search placeholder...',
noResultsPlaceholder: 'Custom no results message'
});
</script>
```

### Creatable Options

Allow users to create new options:

```html
<select class="yoSelect" data-yo-creatable="true">
<!-- options -->
</select>
<!-- or via JavaScript -->
<script>
new YoSelect(element, {
creatable: true,
addOptionPlaceholder: 'Press Enter to create "[term]"'
});
</script>
```
### Clearable Selection

Enable clearing of selection:
```html
<select class="yoSelect" data-yo-clearable="true">
<!-- options -->
</select>
```
### Placeholder Text

Set placeholder text in three ways:

1. Using data-placeholder attribute:
```html
<option value="" data-placeholder="Choose an option...">Choose an option...</option>
```
2. Using JavaScript:
```html
<option value="">Select something...</option>
```
3. Using configuration:
```javascript
new YoSelect(element, {
placeholder: 'Please select...'
});
```
### Custom Styling

Add custom classes to tags in multiple selection mode:
```javascript
new YoSelect(element, {
classTag: 'custom-tag-class'
});
```

### Event Listener

Add an event listener to the select element:
```javascript
const select = new YoSelect(element);
select.element.addEventListener('change', (event) => {
console.log('Selection changed:', event.target.value);
});
```
## Browser Support

YoSelect is compatible with all modern browsers including:
- Chrome
- Firefox
- Safari
- Edge

## Examples

### Basic Single Select with Search

```html
<select class="yoSelect" data-yo-search="true">
<option value="">Select a country</option>
<option value="us" data-yo-img="flag-us.png">United States</option>
<option value="uk" data-yo-img="flag-uk.png">United Kingdom</option>
</select>
```
### Multiple Select with Create Option
```html
<select class="yoSelect" multiple data-yo-search="true" data-yo-creatable="true">
<option value="js">JavaScript</option>
<option value="py">Python</option>
</select>
```
### Searchable Tags with Custom Styling
```html
<select class="yoSelect" multiple data-yo-search="true">
<option value="tag1">Tag 1</option>
<option value="tag2">Tag 2</option>
</select>
<script>
new YoSelect(element, {
classTag: 'custom-tag',
searchPlaceholder: 'Search tags...'
});
</script>
```
## License

MIT License
