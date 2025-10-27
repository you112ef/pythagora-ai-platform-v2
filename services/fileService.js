const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');

const execAsync = promisify(exec);

class FileService {
  constructor() {
    this.basePath = process.env.FILE_BASE_PATH || '/workspace/files';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
    this.ensureBasePath();
  }

  async ensureBasePath() {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create base path:', error);
    }
  }

  async createFile(filePath, content, options = {}) {
    try {
      const fullPath = this.resolvePath(filePath);
      const dir = path.dirname(fullPath);
      
      // Create directory if it doesn't exist
      await fs.mkdir(dir, { recursive: true });
      
      // Write file
      await fs.writeFile(fullPath, content, options.encoding || 'utf8');
      
      // Get file stats
      const stats = await fs.stat(fullPath);
      
      return {
        success: true,
        path: filePath,
        fullPath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return {
        success: false,
        path: filePath,
        error: error.message
      };
    }
  }

  async readFile(filePath, options = {}) {
    try {
      const fullPath = this.resolvePath(filePath);
      const content = await fs.readFile(fullPath, options.encoding || 'utf8');
      
      const stats = await fs.stat(fullPath);
      
      return {
        success: true,
        path: filePath,
        fullPath,
        content,
        size: stats.size,
        modified: stats.mtime
      };
    } catch (error) {
      return {
        success: false,
        path: filePath,
        error: error.message
      };
    }
  }

  async updateFile(filePath, content, options = {}) {
    try {
      const fullPath = this.resolvePath(filePath);
      
      // Check if file exists
      await fs.access(fullPath);
      
      // Write updated content
      await fs.writeFile(fullPath, content, options.encoding || 'utf8');
      
      const stats = await fs.stat(fullPath);
      
      return {
        success: true,
        path: filePath,
        fullPath,
        size: stats.size,
        modified: stats.mtime
      };
    } catch (error) {
      return {
        success: false,
        path: filePath,
        error: error.message
      };
    }
  }

  async deleteFile(filePath) {
    try {
      const fullPath = this.resolvePath(filePath);
      await fs.unlink(fullPath);
      
      return {
        success: true,
        path: filePath,
        fullPath
      };
    } catch (error) {
      return {
        success: false,
        path: filePath,
        error: error.message
      };
    }
  }

  async listFiles(directoryPath, options = {}) {
    try {
      const fullPath = this.resolvePath(directoryPath);
      const { recursive = false, includeHidden = false, pattern } = options;
      
      const files = await this.scanDirectory(fullPath, {
        recursive,
        includeHidden,
        pattern
      });
      
      return {
        success: true,
        path: directoryPath,
        fullPath,
        files,
        count: files.length
      };
    } catch (error) {
      return {
        success: false,
        path: directoryPath,
        error: error.message
      };
    }
  }

  async createDirectory(directoryPath, options = {}) {
    try {
      const fullPath = this.resolvePath(directoryPath);
      const { recursive = true, mode = 0o755 } = options;
      
      await fs.mkdir(fullPath, { recursive, mode });
      
      const stats = await fs.stat(fullPath);
      
      return {
        success: true,
        path: directoryPath,
        fullPath,
        created: stats.birthtime,
        mode: stats.mode
      };
    } catch (error) {
      return {
        success: false,
        path: directoryPath,
        error: error.message
      };
    }
  }

  async deleteDirectory(directoryPath, options = {}) {
    try {
      const fullPath = this.resolvePath(directoryPath);
      const { recursive = false } = options;
      
      if (recursive) {
        await fs.rm(fullPath, { recursive: true, force: true });
      } else {
        await fs.rmdir(fullPath);
      }
      
      return {
        success: true,
        path: directoryPath,
        fullPath
      };
    } catch (error) {
      return {
        success: false,
        path: directoryPath,
        error: error.message
      };
    }
  }

  async copyFile(sourcePath, destinationPath, options = {}) {
    try {
      const sourceFullPath = this.resolvePath(sourcePath);
      const destFullPath = this.resolvePath(destinationPath);
      
      // Create destination directory if it doesn't exist
      const destDir = path.dirname(destFullPath);
      await fs.mkdir(destDir, { recursive: true });
      
      await fs.copyFile(sourceFullPath, destFullPath);
      
      const stats = await fs.stat(destFullPath);
      
      return {
        success: true,
        source: sourcePath,
        destination: destinationPath,
        size: stats.size,
        copied: new Date()
      };
    } catch (error) {
      return {
        success: false,
        source: sourcePath,
        destination: destinationPath,
        error: error.message
      };
    }
  }

  async moveFile(sourcePath, destinationPath, options = {}) {
    try {
      const sourceFullPath = this.resolvePath(sourcePath);
      const destFullPath = this.resolvePath(destinationPath);
      
      // Create destination directory if it doesn't exist
      const destDir = path.dirname(destFullPath);
      await fs.mkdir(destDir, { recursive: true });
      
      await fs.rename(sourceFullPath, destFullPath);
      
      const stats = await fs.stat(destFullPath);
      
      return {
        success: true,
        source: sourcePath,
        destination: destinationPath,
        size: stats.size,
        moved: new Date()
      };
    } catch (error) {
      return {
        success: false,
        source: sourcePath,
        destination: destinationPath,
        error: error.message
      };
    }
  }

  async searchFiles(directoryPath, searchTerm, options = {}) {
    try {
      const fullPath = this.resolvePath(directoryPath);
      const { 
        caseSensitive = false, 
        wholeWord = false, 
        regex = false,
        filePattern = '*',
        maxResults = 100
      } = options;
      
      let grepCommand = `grep -r`;
      
      if (!caseSensitive) {
        grepCommand += ' -i';
      }
      
      if (wholeWord) {
        grepCommand += ' -w';
      }
      
      if (regex) {
        grepCommand += ' -E';
      }
      
      grepCommand += ` --include="${filePattern}"`;
      grepCommand += ` "${searchTerm}" "${fullPath}"`;
      
      const { stdout, stderr } = await execAsync(grepCommand);
      
      const results = this.parseGrepOutput(stdout);
      
      return {
        success: true,
        path: directoryPath,
        searchTerm,
        results: results.slice(0, maxResults),
        count: results.length,
        truncated: results.length > maxResults
      };
    } catch (error) {
      // grep returns exit code 1 when no matches found, which is not an error
      if (error.code === 1) {
        return {
          success: true,
          path: directoryPath,
          searchTerm,
          results: [],
          count: 0
        };
      }
      
      return {
        success: false,
        path: directoryPath,
        searchTerm,
        error: error.message
      };
    }
  }

  async getFileInfo(filePath) {
    try {
      const fullPath = this.resolvePath(filePath);
      const stats = await fs.stat(fullPath);
      
      return {
        success: true,
        path: filePath,
        fullPath,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        mode: stats.mode,
        uid: stats.uid,
        gid: stats.gid
      };
    } catch (error) {
      return {
        success: false,
        path: filePath,
        error: error.message
      };
    }
  }

  async watchFile(filePath, callback, options = {}) {
    try {
      const fullPath = this.resolvePath(filePath);
      
      // Simple file watching implementation
      const watcher = fs.watch(fullPath, options, (eventType, filename) => {
        if (callback) {
          callback(eventType, filename, fullPath);
        }
      });
      
      return {
        success: true,
        path: filePath,
        fullPath,
        watcher
      };
    } catch (error) {
      return {
        success: false,
        path: filePath,
        error: error.message
      };
    }
  }

  async compressFiles(filePaths, archivePath, options = {}) {
    try {
      const { format = 'tar.gz', compression = 'gzip' } = options;
      const fullArchivePath = this.resolvePath(archivePath);
      
      // Create tar command
      let command = 'tar';
      
      if (format === 'tar.gz' || format === 'tgz') {
        command += ' -czf';
      } else if (format === 'tar.bz2') {
        command += ' -cjf';
      } else if (format === 'tar') {
        command += ' -cf';
      } else {
        throw new Error(`Unsupported archive format: ${format}`);
      }
      
      command += ` "${fullArchivePath}"`;
      
      // Add files to archive
      filePaths.forEach(filePath => {
        const fullPath = this.resolvePath(filePath);
        command += ` "${fullPath}"`;
      });
      
      const { stdout, stderr } = await execAsync(command);
      
      const stats = await fs.stat(fullArchivePath);
      
      return {
        success: true,
        archivePath,
        fullArchivePath,
        format,
        files: filePaths,
        size: stats.size,
        created: stats.birthtime
      };
    } catch (error) {
      return {
        success: false,
        archivePath,
        error: error.message
      };
    }
  }

  async extractArchive(archivePath, destinationPath, options = {}) {
    try {
      const fullArchivePath = this.resolvePath(archivePath);
      const fullDestPath = this.resolvePath(destinationPath);
      
      // Create destination directory
      await fs.mkdir(fullDestPath, { recursive: true });
      
      // Determine extraction command based on file extension
      let command;
      if (archivePath.endsWith('.tar.gz') || archivePath.endsWith('.tgz')) {
        command = `tar -xzf "${fullArchivePath}" -C "${fullDestPath}"`;
      } else if (archivePath.endsWith('.tar.bz2')) {
        command = `tar -xjf "${fullArchivePath}" -C "${fullDestPath}"`;
      } else if (archivePath.endsWith('.tar')) {
        command = `tar -xf "${fullArchivePath}" -C "${fullDestPath}"`;
      } else if (archivePath.endsWith('.zip')) {
        command = `unzip "${fullArchivePath}" -d "${fullDestPath}"`;
      } else {
        throw new Error(`Unsupported archive format: ${path.extname(archivePath)}`);
      }
      
      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        archivePath,
        destinationPath,
        extracted: new Date()
      };
    } catch (error) {
      return {
        success: false,
        archivePath,
        destinationPath,
        error: error.message
      };
    }
  }

  async calculateFileHash(filePath, algorithm = 'sha256') {
    try {
      const fullPath = this.resolvePath(filePath);
      const content = await fs.readFile(fullPath);
      const hash = crypto.createHash(algorithm).update(content).digest('hex');
      
      return {
        success: true,
        path: filePath,
        algorithm,
        hash
      };
    } catch (error) {
      return {
        success: false,
        path: filePath,
        error: error.message
      };
    }
  }

  async compareFiles(filePath1, filePath2) {
    try {
      const fullPath1 = this.resolvePath(filePath1);
      const fullPath2 = this.resolvePath(filePath2);
      
      const content1 = await fs.readFile(fullPath1);
      const content2 = await fs.readFile(fullPath2);
      
      const hash1 = crypto.createHash('sha256').update(content1).digest('hex');
      const hash2 = crypto.createHash('sha256').update(content2).digest('hex');
      
      return {
        success: true,
        file1: filePath1,
        file2: filePath2,
        identical: hash1 === hash2,
        size1: content1.length,
        size2: content2.length
      };
    } catch (error) {
      return {
        success: false,
        file1: filePath1,
        file2: filePath2,
        error: error.message
      };
    }
  }

  async getDirectorySize(directoryPath) {
    try {
      const fullPath = this.resolvePath(directoryPath);
      const size = await this.calculateDirectorySize(fullPath);
      
      return {
        success: true,
        path: directoryPath,
        fullPath,
        size,
        sizeFormatted: this.formatBytes(size)
      };
    } catch (error) {
      return {
        success: false,
        path: directoryPath,
        error: error.message
      };
    }
  }

  async cleanupOldFiles(directoryPath, options = {}) {
    try {
      const { 
        maxAge = 30 * 24 * 60 * 60 * 1000, // 30 days
        pattern = '*',
        dryRun = false
      } = options;
      
      const fullPath = this.resolvePath(directoryPath);
      const files = await this.scanDirectory(fullPath, { pattern });
      const now = Date.now();
      const cutoffTime = now - maxAge;
      
      const oldFiles = files.filter(file => {
        const stats = file.stats;
        return stats.mtime.getTime() < cutoffTime;
      });
      
      if (!dryRun) {
        for (const file of oldFiles) {
          await fs.unlink(file.fullPath);
        }
      }
      
      return {
        success: true,
        path: directoryPath,
        oldFiles: oldFiles.map(f => f.path),
        count: oldFiles.length,
        dryRun
      };
    } catch (error) {
      return {
        success: false,
        path: directoryPath,
        error: error.message
      };
    }
  }

  // Helper methods
  resolvePath(filePath) {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.join(this.basePath, filePath);
  }

  async scanDirectory(dirPath, options = {}) {
    const { recursive = false, includeHidden = false, pattern = '*' } = options;
    const files = [];
    
    const scan = async (currentPath, relativePath = '') => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!includeHidden && entry.name.startsWith('.')) {
          continue;
        }
        
        const fullPath = path.join(currentPath, entry.name);
        const relativeFilePath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          if (recursive) {
            await scan(fullPath, relativeFilePath);
          }
        } else {
          // Simple pattern matching
          if (this.matchesPattern(entry.name, pattern)) {
            const stats = await fs.stat(fullPath);
            files.push({
              name: entry.name,
              path: relativeFilePath,
              fullPath,
              stats,
              size: stats.size,
              modified: stats.mtime
            });
          }
        }
      }
    };
    
    await scan(dirPath);
    return files;
  }

  matchesPattern(filename, pattern) {
    if (pattern === '*') return true;
    
    // Simple glob pattern matching
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filename);
  }

  parseGrepOutput(output) {
    const lines = output.trim().split('\n');
    return lines.map(line => {
      const parts = line.split(':');
      if (parts.length >= 3) {
        const filePath = parts[0];
        const lineNumber = parseInt(parts[1]);
        const content = parts.slice(2).join(':');
        
        return {
          file: filePath,
          line: lineNumber,
          content: content.trim()
        };
      }
      return null;
    }).filter(Boolean);
  }

  async calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    const scan = async (currentPath) => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    };
    
    await scan(dirPath);
    return totalSize;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  calculateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

module.exports = new FileService();