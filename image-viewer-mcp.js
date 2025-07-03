#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';

class ImageMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'image-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'readImage',
          description:
            'Read an image file from the filesystem and return it as base64 encoded data for AI analysis',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description:
                  'Path to the image file (relative to current working directory, project root, or absolute path)',
              },
              description: {
                type: 'string',
                description:
                  'Optional description of what to look for in the image',
                default: '',
              },
              projectRoot: {
                type: 'string',
                description:
                  'Optional project root to resolve relative file paths',
                default: '',
              },
            },
            required: ['filePath'],
          },
        },
        {
          name: 'listImages',
          description:
            'List image files in a directory (useful for finding Dusk screenshots)',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description:
                  'Directory to search for images (default: tests/Browser/screenshots)',
                default: 'tests/Browser/screenshots',
              },
              pattern: {
                type: 'string',
                description: 'File pattern to match (default: *.png)',
                default: '*.png',
              },
              recursive: {
                type: 'boolean',
                description: 'Search recursively in subdirectories',
                default: false,
              },
              projectRoot: {
                type: 'string',
                description:
                  'Optional project root to resolve relative directory paths',
                default: '',
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'readImage':
            return await this.readImage(
              args.filePath,
              args.description,
              args.projectRoot
            );
          case 'listImages':
            return await this.listImages(
              args.directory,
              args.pattern,
              args.recursive,
              args.projectRoot
            );

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async readImage(filePath, description = '', projectRoot = '') {
    try {
      // Log the current working directory and the file path being resolved
      console.error(`[readImage] process.cwd(): ${process.cwd()}`);
      console.error(`[readImage] filePath argument: ${filePath}`);
      if (projectRoot) {
        console.error(`[readImage] projectRoot argument: ${projectRoot}`);
      }

      // If the filePath is not absolute, resolve it relative to projectRoot (if provided), else process.cwd()
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : projectRoot
          ? path.resolve(projectRoot, filePath)
          : path.resolve(process.cwd(), filePath);

      // Log the resolved path
      console.error(`[readImage] resolvedPath: ${resolvedPath}`);

      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Image file not found.\nprocess.cwd(): ${process.cwd()}\nfilePath argument: ${filePath}\nprojectRoot: ${projectRoot || '(not provided)'}\nresolvedPath: ${resolvedPath}`,
            },
          ],
          isError: true,
        };
      }

      // Check if it's actually a file
      const stats = fs.statSync(resolvedPath);
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${resolvedPath}`);
      }

      // Read the file
      const imageBuffer = fs.readFileSync(resolvedPath);

      // Get file extension to determine MIME type
      const ext = path.extname(resolvedPath).toLowerCase();
      const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
      };

      const mimeType = mimeTypes[ext] || 'application/octet-stream';

      // Convert to base64
      const base64Data = imageBuffer.toString('base64');

      return {
        content: [
          {
            type: 'text',
            text: `Successfully read image: ${resolvedPath}\nFile size: ${stats.size} bytes\nMIME type: ${mimeType}${description ? `\nDescription: ${description}` : ''}`,
          },
          {
            type: 'image',
            data: base64Data,
            mimeType: mimeType,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to read image: ${error.message}`);
    }
  }

  async listImages(
    directory = 'tests/Browser/screenshots',
    pattern = '*.png',
    recursive = false,
    projectRoot = ''
  ) {
    try {
      // Log the current working directory and the directory being resolved
      console.error(`[listImages] process.cwd(): ${process.cwd()}`);
      console.error(`[listImages] directory argument: ${directory}`);
      if (projectRoot) {
        console.error(`[listImages] projectRoot argument: ${projectRoot}`);
      }

      // If the directory is not absolute, resolve it relative to projectRoot (if provided), else process.cwd()
      const resolvedDir = path.isAbsolute(directory)
        ? directory
        : projectRoot
          ? path.resolve(projectRoot, directory)
          : path.resolve(process.cwd(), directory);

      // Log the resolved directory
      console.error(`[listImages] resolvedDir: ${resolvedDir}`);

      if (!fs.existsSync(resolvedDir)) {
        throw new Error(
          `Directory not found.\nprocess.cwd(): ${process.cwd()}\ndirectory argument: ${directory}\nprojectRoot: ${projectRoot || '(not provided)'}\nresolvedDir: ${resolvedDir}`
        );
      }

      const images = [];

      const scanDirectory = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory() && recursive) {
            scanDirectory(fullPath);
          } else if (entry.isFile()) {
            // Simple pattern matching (just check extension for now)
            const ext = path.extname(entry.name).toLowerCase();
            const imageExts = [
              '.png',
              '.jpg',
              '.jpeg',
              '.gif',
              '.bmp',
              '.webp',
              '.svg',
            ];

            if (pattern === '*.png' && ext === '.png') {
              images.push({
                name: entry.name,
                path: fullPath,
                relativePath: path.relative(
                  projectRoot || process.cwd(),
                  fullPath
                ),
                size: fs.statSync(fullPath).size,
                modified: fs.statSync(fullPath).mtime,
              });
            } else if (pattern === '*' && imageExts.includes(ext)) {
              images.push({
                name: entry.name,
                path: fullPath,
                relativePath: path.relative(
                  projectRoot || process.cwd(),
                  fullPath
                ),
                size: fs.statSync(fullPath).size,
                modified: fs.statSync(fullPath).mtime,
              });
            }
          }
        }
      };

      scanDirectory(resolvedDir);

      // Sort by modification time (newest first)
      images.sort((a, b) => new Date(b.modified) - new Date(a.modified));

      return {
        content: [
          {
            type: 'text',
            text:
              `Found ${images.length} image(s) in ${resolvedDir}:\n\n` +
              images
                .map(
                  (img) =>
                    `📸 ${img.name}\n` +
                    `   Path: ${img.relativePath}\n` +
                    `   Size: ${(img.size / 1024).toFixed(1)} KB\n` +
                    `   Modified: ${img.modified.toISOString()}\n`
                )
                .join('\n'),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list images: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Image MCP server running on stdio');
  }
}

const server = new ImageMCPServer();
server.run().catch(console.error);
