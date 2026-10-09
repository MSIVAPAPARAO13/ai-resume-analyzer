import type {
  IGitHubProvider,
  GitHubUser,
  GitHubRepoResponse,
} from './github.interface.js';

export class MockGitHubProvider implements IGitHubProvider {
  getAuthorizationUrl(state: string): string {
    return `http://localhost:4000/api/v1/github/callback?code=mock_github_auth_code_123&state=${encodeURIComponent(state)}`;
  }

  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }> {
    if (code === 'invalid_code') {
      throw new Error('Invalid authorization code');
    }
    return {
      accessToken: 'gho_mock_access_token_secure_987654321',
      refreshToken: 'ghr_mock_refresh_token_123456789',
      expiresIn: 28800,
    };
  }

  async getAuthenticatedUser(_accessToken: string): Promise<GitHubUser> {
    return {
      id: 12345678,
      login: 'octocat-engineer',
      name: 'The Octocat',
      avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
      html_url: 'https://github.com/octocat-engineer',
      public_repos: 3,
      bio: 'Open source contributor and cloud architecture enthusiast.',
    };
  }

  async listRepositories(
    _accessToken: string,
    _page = 1,
    _perPage = 30,
  ): Promise<GitHubRepoResponse[]> {
    return [
      {
        id: 101,
        name: 'tradeflow',
        full_name: 'octocat-engineer/tradeflow',
        description:
          'High throughput algorithmic trading order matching engine built with TypeScript, Node.js, and Redis.',
        html_url: 'https://github.com/octocat-engineer/tradeflow',
        default_branch: 'main',
        language: 'TypeScript',
        stargazers_count: 142,
        forks_count: 24,
        private: false,
        topics: ['fintech', 'typescript', 'redis', 'nodejs', 'trading'],
        pushed_at: '2026-09-20T10:00:00Z',
      },
      {
        id: 102,
        name: 'cloud-metrics-agent',
        full_name: 'octocat-engineer/cloud-metrics-agent',
        description:
          'Lightweight telemetry and metrics collection daemon using Go, Docker, and Prometheus.',
        html_url: 'https://github.com/octocat-engineer/cloud-metrics-agent',
        default_branch: 'main',
        language: 'Go',
        stargazers_count: 89,
        forks_count: 11,
        private: false,
        topics: ['go', 'docker', 'prometheus', 'telemetry', 'kubernetes'],
        pushed_at: '2026-08-15T14:30:00Z',
      },
      {
        id: 103,
        name: 'neural-canvas',
        full_name: 'octocat-engineer/neural-canvas',
        description:
          'Interactive generative canvas powered by React, Python, and WebGL.',
        html_url: 'https://github.com/octocat-engineer/neural-canvas',
        default_branch: 'main',
        language: 'Python',
        stargazers_count: 310,
        forks_count: 45,
        private: false,
        topics: ['react', 'python', 'webgl', 'machine-learning'],
        pushed_at: '2026-09-28T18:00:00Z',
      },
    ];
  }

  async getRepository(
    _accessToken: string,
    _owner: string,
    repo: string,
  ): Promise<GitHubRepoResponse> {
    const all = await this.listRepositories(_accessToken);
    const found = all.find((r) => r.name.toLowerCase() === repo.toLowerCase());
    if (found) return found;
    return all[0];
  }

  async getRepositoryLanguages(
    _accessToken: string,
    _owner: string,
    repo: string,
  ): Promise<Record<string, number>> {
    if (repo === 'tradeflow') {
      return {
        TypeScript: 124500,
        JavaScript: 18200,
        HTML: 3500,
        CSS: 2100,
      };
    }
    if (repo === 'cloud-metrics-agent') {
      return {
        Go: 98000,
        Dockerfile: 1200,
        Makefile: 800,
      };
    }
    return {
      Python: 85000,
      TypeScript: 42000,
      HTML: 4000,
    };
  }

  async getRepositoryReadme(
    _accessToken: string,
    _owner: string,
    repo: string,
  ): Promise<{ content: string; encoding: string; decodedContent: string }> {
    let markdown = '';
    if (repo === 'tradeflow') {
      markdown = `# TradeFlow Matching Engine
TradeFlow is a high-performance algorithmic order book and matching engine.

## Technologies
- **Runtime**: Node.js & TypeScript
- **State Store**: Redis
- **Framework**: Express.js
- **Persistence**: MongoDB & PostgreSQL
- **Testing**: Jest

## Key Features
- Sub-millisecond order matching latency
- In-memory order book state replication
- REST & WebSocket APIs for trade execution
- Automated risk checks and position limits
`;
    } else if (repo === 'cloud-metrics-agent') {
      markdown = `# Cloud Metrics Agent
A lightweight containerized daemon for cloud telemetry.

## Technologies
- Go (Golang)
- Docker
- Prometheus
- Kubernetes
- Linux eBPF
`;
    } else {
      markdown = `# Neural Canvas
Generative creative coding platform.

## Technologies
- React
- Python FastAPI
- WebGL / Three.js
- TailwindCSS
`;
    }

    const base64 = Buffer.from(markdown, 'utf8').toString('base64');
    return {
      content: base64,
      encoding: 'base64',
      decodedContent: markdown,
    };
  }
}
