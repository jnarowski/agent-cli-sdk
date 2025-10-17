import { describe, it, expect } from 'vitest';
import { renderConsoleBox } from '../../../src/utils/renderConsoleBox';

describe('renderConsoleBox', () => {
  it('should render a basic box with default options', () => {
    const content = 'Hello, World!';
    const result = renderConsoleBox(content);

    expect(result).toContain('Hello, World!');
    expect(result).toBeTruthy();
  });

  it('should render a box with a title', () => {
    const content = 'Test content';
    const result = renderConsoleBox(content, {
      title: 'Test Title',
    });

    expect(result).toContain('Test content');
    expect(result).toContain('Test Title');
  });

  it('should render a box with custom border color', () => {
    const content = 'Colored box';
    const result = renderConsoleBox(content, {
      borderColor: 'green',
    });

    expect(result).toContain('Colored box');
  });

  it('should render a box with custom width', () => {
    const content = 'Fixed width box';
    const result = renderConsoleBox(content, {
      width: 50,
      fullWidth: false,
    });

    expect(result).toContain('Fixed width box');
  });

  it('should render a box with custom padding', () => {
    const content = 'Padded content';
    const result = renderConsoleBox(content, {
      padding: { top: 2, right: 4, bottom: 2, left: 4 },
    });

    expect(result).toContain('Padded content');
  });

  it('should render a box with custom margin', () => {
    const content = 'Content with margin';
    const result = renderConsoleBox(content, {
      margin: 2,
    });

    expect(result).toContain('Content with margin');
  });

  it('should render a box with custom border style', () => {
    const content = 'Custom border';
    const result = renderConsoleBox(content, {
      borderStyle: 'double',
    });

    expect(result).toContain('Custom border');
  });

  it('should render a box with center text alignment', () => {
    const content = 'Centered text';
    const result = renderConsoleBox(content, {
      textAlignment: 'center',
    });

    expect(result).toContain('Centered text');
  });

  it('should render a box with title alignment', () => {
    const content = 'Content';
    const result = renderConsoleBox(content, {
      title: 'Left Title',
      titleAlignment: 'left',
    });

    expect(result).toContain('Left Title');
    expect(result).toContain('Content');
  });

  it('should handle fullWidth option correctly', () => {
    const content = 'Full width content';
    const resultFullWidth = renderConsoleBox(content, {
      fullWidth: true,
    });

    const resultNoFullWidth = renderConsoleBox(content, {
      fullWidth: false,
    });

    expect(resultFullWidth).toContain('Full width content');
    expect(resultNoFullWidth).toContain('Full width content');
  });

  it('should respect minWidth when using auto width', () => {
    const content = 'Min width test';
    const result = renderConsoleBox(content, {
      width: 'auto',
      minWidth: 80,
      fullWidth: true,
    });

    expect(result).toContain('Min width test');
  });
});
