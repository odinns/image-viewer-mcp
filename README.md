# Image Viewer MCP

An MCP server that provides tools for reading and analyzing image files from the filesystem, where they are normally not accessible to AI assistants like Cursor.

## Features

- **readImage**: Read any image file from the filesystem and return it as base64 encoded data for AI analysis
- **listImages**: List image files in a directory (useful for finding Dusk screenshots)
- **Portable**: Both tools work across multiple projects with optional project root parameter

## Installation

### Local Installation (Git Clone)

```bash
# Clone the repository
git clone https://github.com/odinns/image-viewer-mcp.git

# Navigate to the directory
cd image-viewer-mcp

# Install dependencies
npm install

# Optional: Install globally for easier access
npm install -g .
```

## Configuration

### With Cursor

Add the MCP server to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "image-viewer": {
      "command": "node",
      "args": ["/path/to/image-viewer-mcp/image-viewer-mcp.js"]
    }
  }
}
```

**Note**: Replace `/path/to/image-viewer-mcp/` with the actual path where you cloned the repository.

If you installed globally:
```json
{
  "mcpServers": {
    "image-viewer": {
      "command": "image-viewer-mcp"
    }
  }
}
```

### With Windsurf

Add the MCP server to your `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "image-viewer": {
      "command": "node",
      "args": ["/path/to/image-viewer-mcp/image-viewer-mcp.js"]
    }
  }
}
```

**Note**: Replace `/path/to/image-viewer-mcp/` with the actual path where you cloned the repository.

If you installed globally:
```json
{
  "mcpServers": {
    "image-viewer": {
      "command": "image-viewer-mcp"
    }
  }
}
```

## Tools

### readImage

Read an image file and return it for AI analysis.

**Parameters:**

- `filePath` (required): Path to the image file (relative to current working directory, project root, or absolute path)
- `description` (optional): Description of what to look for in the image
- `projectRoot` (optional): Project root to resolve relative file paths

```javascript
// Example usage through MCP
readImage({
  filePath: 'tests/Browser/screenshots/failure-LoginTest-2025-01-02.png',
  description: 'Login page screenshot showing error state',
  projectRoot: '/path/to/your/project',
});

// Or with relative path (will use process.cwd() if projectRoot not provided)
readImage({
  filePath: 'test-images/screenshot.png',
  description: 'UI screenshot for analysis',
});
```

### listImages

List all image files in a directory.

**Parameters:**

- `directory` (optional): Directory to search for images (default: "tests/Browser/screenshots")
- `pattern` (optional): File pattern to match (default: "*.png")
- `recursive` (optional): Search recursively in subdirectories (default: false)
- `projectRoot` (optional): Project root to resolve relative directory paths

```javascript
// Example usage
listImages({
  directory: 'tests/Browser/screenshots',
  pattern: '*.png',
  recursive: false,
  projectRoot: '/path/to/your/project',
});

// Or with relative directory (will use process.cwd() if projectRoot not provided)
listImages({
  directory: 'test-images',
  pattern: '*.png',
  recursive: false,
});
```

## Use Cases

- **Dusk Test Debugging**: Analyze screenshots from failed Dusk tests to understand what went wrong
- **UI Testing**: Compare expected vs actual UI states
- **Visual Regression Testing**: Analyze visual differences in screenshots
- **Documentation**: Generate documentation from UI screenshots
- **Cross-Project Usage**: Works seamlessly across multiple projects without configuration changes

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run normally
npm start
```

## Requirements

- Node.js >= 18.0.0
- MCP-compatible AI assistant (Cursor, Windsurf, etc.)

## License

MIT
