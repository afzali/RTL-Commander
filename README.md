# RTL Commander

A powerful Chrome extension for managing RTL (Right-to-Left) and LTR (Left-to-Right) text direction on web pages.

## Features

### Basic Mode
- Quick toggle of text direction for any selected element
- Save direction settings for specific elements on a page
- Settings persist across page reloads
- Enable/disable saved settings with a simple toggle

### Advanced Mode
- Apply custom CSS properties to elements
- Fine-grained control over text direction and styling
- Edit saved settings through a user-friendly interface
- Three-dot menu for managing saved settings (edit/delete)

### Context Menu Features
1. **Toggle Direction for Entire Page**: Quickly change the direction of all text on the page
2. **Toggle Vazir Font**: Add or remove the Vazir font with two application modes:
   - As Default Font: Apply Vazir font to all elements on the page
   - For Advanced CSS: Load the font for use in custom CSS settings

### User Interface
- Clean and intuitive popup interface
- Scrollable list of saved settings
- Confirmation dialogs for important actions
- Visual feedback through notifications
- Edit dialog for modifying saved settings
- All Domains tab to manage settings across all websites

## Recent Updates

### Version 1.2
- **Added**: New "All Domains" tab that lets you view and manage settings from all websites in one place
- **Fixed**: Toggle functionality now correctly disables settings without deleting them
- **Fixed**: Changes made in the advanced panel now apply immediately without requiring a page refresh
- **Improved**: Better handling of empty or disabled CSS settings
- **Enhanced**: Support for Single Page Applications (SPAs) with automatic style reapplication on navigation
- **Updated**: All notifications and messages are now in English
- **Optimized**: Codebase cleanup and performance improvements

### Version 1.1
- **Fixed**: RTL settings now correctly apply on page load without requiring manual toggling
- **Improved**: Enhanced CSS application to ensure RTL/LTR styles take precedence over existing page styles
- **Added**: Multiple initialization points to handle dynamic content loading
- **Enhanced**: Better cleanup of styles when toggling RTL/LTR settings
- **Improved**: MutationObserver now watches for attribute changes that might affect text direction

## How to Use

### Basic Usage
1. Right-click on any element to toggle its text direction
2. Use the popup to view and manage saved settings
3. Toggle settings on/off using the switch in the popup

### Advanced Features
1. Click the three-dot menu on any saved setting to:
   - Edit the selector, direction, and custom CSS
   - Delete the setting
2. Use the context menu to:
   - Toggle direction for the entire page
   - Add Vazir font (with options for application mode)
3. Use the "All Domains" tab to:
   - View settings from all websites
   - Edit settings for any domain
   - Delete individual settings from any domain
   - Clear all settings across all domains with a single button

### Managing Font Settings
1. Right-click anywhere on the page
2. Select "Toggle Vazir Font"
3. Choose how to apply the font:
   - "As Default Font" to apply it to all elements
   - "For Advanced CSS" to use it in custom CSS settings

## Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any problems or have suggestions, please [open an issue](https://github.com/[username]/RTL-Commander/issues) on GitHub.

## Authors

- Initial work - [afzali](https://github.com/afzali)

## Acknowledgments

- Thanks to all contributors who help improve this extension
- Special thanks to the open source community

---
Made with ❤️ for the multilingual web
