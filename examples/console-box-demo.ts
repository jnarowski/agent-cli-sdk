import { renderConsoleBox } from '../src/utils/renderConsoleBox.js';

console.log('=== Console Box Rendering Demo ===\n');

// Example 1: Basic box with default settings (full width)
console.log('1. Basic Box (Full Width):');
console.log(renderConsoleBox('Hello, World! This is a basic box with default settings.'));
console.log();

// Example 2: Box with a title
console.log('2. Box with Title:');
console.log(
  renderConsoleBox('This box has a title at the top.', {
    title: 'Welcome Message',
  })
);
console.log();

// Example 3: Box with custom colors
console.log('3. Colored Boxes:');
console.log(
  renderConsoleBox('This is an info box with blue border.', {
    title: 'Info',
    borderColor: 'blue',
  })
);
console.log(
  renderConsoleBox('This is a success box with green border.', {
    title: 'Success',
    borderColor: 'green',
  })
);
console.log(
  renderConsoleBox('This is a warning box with yellow border.', {
    title: 'Warning',
    borderColor: 'yellow',
  })
);
console.log(
  renderConsoleBox('This is an error box with red border.', {
    title: 'Error',
    borderColor: 'red',
  })
);
console.log();

// Example 4: Box with custom width (not full width)
console.log('4. Fixed Width Box:');
console.log(
  renderConsoleBox('This box has a fixed width of 50 characters.', {
    title: 'Fixed Width',
    width: 50,
    fullWidth: false,
  })
);
console.log();

// Example 5: Box with custom padding
console.log('5. Custom Padding:');
console.log(
  renderConsoleBox('This box has extra padding on all sides.', {
    title: 'Padded Box',
    padding: { top: 2, right: 4, bottom: 2, left: 4 },
  })
);
console.log();

// Example 6: Box with different border styles
console.log('6. Different Border Styles:');
console.log(
  renderConsoleBox('Round border (default)', {
    borderStyle: 'round',
    borderColor: 'cyan',
  })
);
console.log(
  renderConsoleBox('Double border', {
    borderStyle: 'double',
    borderColor: 'magenta',
  })
);
console.log(
  renderConsoleBox('Single border', {
    borderStyle: 'single',
    borderColor: 'yellow',
  })
);
console.log();

// Example 7: Centered text
console.log('7. Text Alignment:');
console.log(
  renderConsoleBox('This text is centered within the box.', {
    title: 'Centered Text',
    textAlignment: 'center',
  })
);
console.log();

// Example 8: Multi-line content
console.log('8. Multi-line Content:');
const multiLineContent = [
  'Line 1: This is the first line',
  'Line 2: This is the second line',
  'Line 3: This is the third line',
  '',
  'You can include blank lines too!',
].join('\n');
console.log(
  renderConsoleBox(multiLineContent, {
    title: 'Multi-line Example',
    borderColor: 'green',
  })
);
console.log();

// Example 9: Compact box with minimal spacing
console.log('9. Compact Box:');
console.log(
  renderConsoleBox('Minimal spacing', {
    padding: 0,
    margin: 0,
    borderColor: 'gray',
  })
);
console.log();

// Example 10: Title alignment
console.log('10. Title Alignment:');
console.log(
  renderConsoleBox('Title on the left', {
    title: 'Left Title',
    titleAlignment: 'left',
    borderColor: 'blue',
  })
);
console.log(
  renderConsoleBox('Title in the center', {
    title: 'Center Title',
    titleAlignment: 'center',
    borderColor: 'green',
  })
);
console.log(
  renderConsoleBox('Title on the right', {
    title: 'Right Title',
    titleAlignment: 'right',
    borderColor: 'yellow',
  })
);
