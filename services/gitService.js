const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const execAsync = promisify(exec);

class GitService {
  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN;
    this.githubApiUrl = 'https://api.github.com';
  }

  async clone(repository, options = {}) {
    try {
      const { branch = 'main', depth = 1, destination } = options;
      const dest = destination || path.basename(repository, '.git');
      
      let command = `git clone --depth ${depth}`;
      if (branch !== 'main') {
        command += ` --branch ${branch}`;
      }
      command += ` ${repository}`;
      
      if (destination) {
        command += ` ${destination}`;
      }

      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        repository,
        destination: dest,
        branch,
        output: stdout,
        error: stderr
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  async commit(repository, options = {}) {
    try {
      const { message, files = ['.'], author } = options;
      
      if (!message) {
        throw new Error('Commit message is required');
      }

      // Add files
      const addCommand = `cd ${repository} && git add ${files.join(' ')}`;
      await execAsync(addCommand);

      // Commit
      let commitCommand = `cd ${repository} && git commit -m "${message}"`;
      if (author) {
        commitCommand += ` --author="${author}"`;
      }

      const { stdout, stderr } = await execAsync(commitCommand);
      
      return {
        success: true,
        repository,
        message,
        files,
        output: stdout,
        error: stderr
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  async push(repository, options = {}) {
    try {
      const { remote = 'origin', branch = 'main', force = false } = options;
      
      let command = `cd ${repository} && git push ${remote} ${branch}`;
      if (force) {
        command += ' --force';
      }

      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        repository,
        remote,
        branch,
        output: stdout,
        error: stderr
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  async pull(repository, options = {}) {
    try {
      const { remote = 'origin', branch = 'main' } = options;
      
      const command = `cd ${repository} && git pull ${remote} ${branch}`;
      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        repository,
        remote,
        branch,
        output: stdout,
        error: stderr
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  async createBranch(repository, options = {}) {
    try {
      const { branch, checkout = true } = options;
      
      if (!branch) {
        throw new Error('Branch name is required');
      }

      let command = `cd ${repository} && git branch ${branch}`;
      if (checkout) {
        command += ` && git checkout ${branch}`;
      }

      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        repository,
        branch,
        output: stdout,
        error: stderr
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  async merge(repository, options = {}) {
    try {
      const { branch, targetBranch = 'main', noFF = false } = options;
      
      if (!branch) {
        throw new Error('Branch to merge is required');
      }

      let command = `cd ${repository} && git checkout ${targetBranch} && git merge ${branch}`;
      if (noFF) {
        command += ' --no-ff';
      }

      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        repository,
        branch,
        targetBranch,
        output: stdout,
        error: stderr
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  async getStatus(repository) {
    try {
      const command = `cd ${repository} && git status --porcelain`;
      const { stdout, stderr } = await execAsync(command);
      
      const status = this.parseStatusOutput(stdout);
      
      return {
        success: true,
        repository,
        status,
        output: stdout,
        error: stderr
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  async getLog(repository, options = {}) {
    try {
      const { count = 10, branch = 'main', since, until } = options;
      
      let command = `cd ${repository} && git log --oneline -n ${count}`;
      if (branch !== 'main') {
        command += ` ${branch}`;
      }
      if (since) {
        command += ` --since="${since}"`;
      }
      if (until) {
        command += ` --until="${until}"`;
      }

      const { stdout, stderr } = await execAsync(command);
      
      const commits = this.parseLogOutput(stdout);
      
      return {
        success: true,
        repository,
        commits,
        count: commits.length,
        output: stdout,
        error: stderr
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  async createPullRequest(repository, options = {}) {
    try {
      if (!this.githubToken) {
        throw new Error('GitHub token is required for creating pull requests');
      }

      const { title, body, head, base = 'main' } = options;
      
      if (!title || !head) {
        throw new Error('Title and head branch are required');
      }

      const { owner, repo } = this.parseRepositoryUrl(repository);
      
      const response = await axios.post(
        `${this.githubApiUrl}/repos/${owner}/${repo}/pulls`,
        {
          title,
          body: body || '',
          head,
          base
        },
        {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      return {
        success: true,
        repository,
        pullRequest: response.data,
        number: response.data.number,
        url: response.data.html_url
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        response: error.response?.data
      };
    }
  }

  async createIssue(repository, options = {}) {
    try {
      if (!this.githubToken) {
        throw new Error('GitHub token is required for creating issues');
      }

      const { title, body, labels = [], assignees = [] } = options;
      
      if (!title) {
        throw new Error('Title is required');
      }

      const { owner, repo } = this.parseRepositoryUrl(repository);
      
      const response = await axios.post(
        `${this.githubApiUrl}/repos/${owner}/${repo}/issues`,
        {
          title,
          body: body || '',
          labels,
          assignees
        },
        {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      return {
        success: true,
        repository,
        issue: response.data,
        number: response.data.number,
        url: response.data.html_url
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        response: error.response?.data
      };
    }
  }

  async getBranches(repository) {
    try {
      const command = `cd ${repository} && git branch -a`;
      const { stdout, stderr } = await execAsync(command);
      
      const branches = this.parseBranchesOutput(stdout);
      
      return {
        success: true,
        repository,
        branches,
        count: branches.length,
        output: stdout,
        error: stderr
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  async getDiff(repository, options = {}) {
    try {
      const { commit1, commit2, file } = options;
      
      let command = `cd ${repository} && git diff`;
      if (commit1 && commit2) {
        command += ` ${commit1} ${commit2}`;
      } else if (commit1) {
        command += ` ${commit1}`;
      }
      if (file) {
        command += ` -- ${file}`;
      }

      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        repository,
        diff: stdout,
        output: stdout,
        error: stderr
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  async stash(repository, options = {}) {
    try {
      const { message, includeUntracked = false } = options;
      
      let command = `cd ${repository} && git stash`;
      if (message) {
        command += ` push -m "${message}"`;
      }
      if (includeUntracked) {
        command += ' --include-untracked';
      }

      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        repository,
        output: stdout,
        error: stderr
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  async stashPop(repository) {
    try {
      const command = `cd ${repository} && git stash pop`;
      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        repository,
        output: stdout,
        error: stderr
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  async reset(repository, options = {}) {
    try {
      const { commit = 'HEAD', mode = 'soft' } = options;
      
      const command = `cd ${repository} && git reset --${mode} ${commit}`;
      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        repository,
        commit,
        mode,
        output: stdout,
        error: stderr
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  async tag(repository, options = {}) {
    try {
      const { name, message, commit = 'HEAD' } = options;
      
      if (!name) {
        throw new Error('Tag name is required');
      }

      let command = `cd ${repository} && git tag`;
      if (message) {
        command += ` -a ${name} -m "${message}"`;
      } else {
        command += ` ${name}`;
      }
      if (commit !== 'HEAD') {
        command += ` ${commit}`;
      }

      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        repository,
        tag: name,
        commit,
        output: stdout,
        error: stderr
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  async getTags(repository) {
    try {
      const command = `cd ${repository} && git tag -l`;
      const { stdout, stderr } = await execAsync(command);
      
      const tags = stdout.trim().split('\n').filter(tag => tag.length > 0);
      
      return {
        success: true,
        repository,
        tags,
        count: tags.length,
        output: stdout,
        error: stderr
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  async getRepositoryInfo(repository) {
    try {
      if (!this.githubToken) {
        throw new Error('GitHub token is required for repository info');
      }

      const { owner, repo } = this.parseRepositoryUrl(repository);
      
      const response = await axios.get(
        `${this.githubApiUrl}/repos/${owner}/${repo}`,
        {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      return {
        success: true,
        repository,
        info: response.data,
        name: response.data.name,
        fullName: response.data.full_name,
        description: response.data.description,
        language: response.data.language,
        stars: response.data.stargazers_count,
        forks: response.data.forks_count,
        openIssues: response.data.open_issues_count
      };
    } catch (error) {
      return {
        success: false,
        repository,
        error: error.message,
        response: error.response?.data
      };
    }
  }

  // Helper methods
  parseRepositoryUrl(repository) {
    const match = repository.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    return {
      owner: match[1],
      repo: match[2]
    };
  }

  parseStatusOutput(output) {
    const lines = output.trim().split('\n');
    const status = {
      staged: [],
      unstaged: [],
      untracked: []
    };

    lines.forEach(line => {
      if (line.length === 0) return;
      
      const statusCode = line.substring(0, 2);
      const file = line.substring(3);
      
      if (statusCode.includes('A') || statusCode.includes('M') || statusCode.includes('D')) {
        status.staged.push({ file, status: statusCode });
      }
      if (statusCode.includes('M') || statusCode.includes('D')) {
        status.unstaged.push({ file, status: statusCode });
      }
      if (statusCode.includes('??')) {
        status.untracked.push({ file, status: statusCode });
      }
    });

    return status;
  }

  parseLogOutput(output) {
    const lines = output.trim().split('\n');
    return lines.map(line => {
      const [hash, ...messageParts] = line.split(' ');
      return {
        hash,
        message: messageParts.join(' ')
      };
    });
  }

  parseBranchesOutput(output) {
    const lines = output.trim().split('\n');
    return lines.map(line => {
      const isCurrent = line.startsWith('*');
      const name = line.replace(/^\*\s*/, '').trim();
      return {
        name,
        current: isCurrent
      };
    });
  }
}

module.exports = new GitService();