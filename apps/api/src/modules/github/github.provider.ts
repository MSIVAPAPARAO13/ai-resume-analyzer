import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error-handler.js';
import { logger } from '../../utils/logger.js';
import type {
  IGitHubProvider,
  GitHubUser,
  GitHubRepoResponse,
  GitHubReadmeResponse,
} from './github.interface.js';

export class GitHubProvider implements IGitHubProvider {
  private clientId: string;
  private clientSecret: string;
  private callbackUrl: string;

  constructor(clientId?: string, clientSecret?: string, callbackUrl?: string) {
    this.clientId = clientId || env.GITHUB_CLIENT_ID || '';
    this.clientSecret = clientSecret || env.GITHUB_CLIENT_SECRET || '';
    this.callbackUrl = callbackUrl || env.GITHUB_CALLBACK_URL;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      scope: 'read:user,repo',
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }> {
    if (!this.clientId || !this.clientSecret) {
      throw new AppError(
        'GitHub OAuth credentials not configured on server',
        500,
        'GITHUB_CONFIG_ERROR',
      );
    }

    try {
      const response = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code,
            redirect_uri: this.callbackUrl,
          }),
        },
      );

      if (!response.ok) {
        throw new AppError(
          `GitHub token exchange failed: ${response.statusText}`,
          response.status,
          'GITHUB_OAUTH_ERROR',
        );
      }

      const data = (await response.json()) as any;
      if (data.error) {
        throw new AppError(
          `GitHub OAuth error: ${data.error_description || data.error}`,
          400,
          'GITHUB_OAUTH_FAILED',
        );
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      logger.error({ err }, 'Failed to exchange GitHub authorization code');
      throw new AppError(
        'Failed to exchange authorization code with GitHub',
        502,
        'GITHUB_NETWORK_ERROR',
      );
    }
  }

  private async fetchApi<T>(endpoint: string, accessToken: string): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `https://api.github.com${endpoint}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Resumind-App',
      },
    });

    const rateLimitRemaining = res.headers.get('x-ratelimit-remaining');
    const rateLimitReset = res.headers.get('x-ratelimit-reset');

    if (res.status === 403 && rateLimitRemaining === '0') {
      const resetTime = rateLimitReset
        ? new Date(Number(rateLimitReset) * 1000).toLocaleTimeString()
        : 'shortly';
      throw new AppError(
        `GitHub API rate limit exceeded. Resets at ${resetTime}`,
        429,
        'GITHUB_RATE_LIMITED',
      );
    }

    if (!res.ok) {
      let errMsg = res.statusText;
      try {
        const body = (await res.json()) as any;
        errMsg = body.message || errMsg;
      } catch {
        // ignore parse error
      }

      if (res.status === 401) {
        throw new AppError(
          'GitHub access token is invalid or expired',
          401,
          'GITHUB_UNAUTHORIZED',
        );
      }

      if (res.status === 404) {
        throw new AppError(
          'GitHub resource not found',
          404,
          'GITHUB_NOT_FOUND',
        );
      }

      throw new AppError(
        `GitHub API error: ${errMsg}`,
        res.status,
        'GITHUB_API_ERROR',
      );
    }

    return (await res.json()) as T;
  }

  async getAuthenticatedUser(accessToken: string): Promise<GitHubUser> {
    return this.fetchApi<GitHubUser>('/user', accessToken);
  }

  async listRepositories(
    accessToken: string,
    page = 1,
    perPage = 30,
  ): Promise<GitHubRepoResponse[]> {
    return this.fetchApi<GitHubRepoResponse[]>(
      `/user/repos?sort=updated&direction=desc&per_page=${perPage}&page=${page}`,
      accessToken,
    );
  }

  async getRepository(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<GitHubRepoResponse> {
    return this.fetchApi<GitHubRepoResponse>(
      `/repos/${owner}/${repo}`,
      accessToken,
    );
  }

  async getRepositoryLanguages(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<Record<string, number>> {
    return this.fetchApi<Record<string, number>>(
      `/repos/${owner}/${repo}/languages`,
      accessToken,
    );
  }

  async getRepositoryReadme(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<{ content: string; encoding: string; decodedContent: string }> {
    const data = await this.fetchApi<GitHubReadmeResponse>(
      `/repos/${owner}/${repo}/readme`,
      accessToken,
    );

    let decodedContent = '';
    if (data.encoding === 'base64' && data.content) {
      decodedContent = Buffer.from(data.content, 'base64').toString('utf8');
    } else {
      decodedContent = data.content || '';
    }

    return {
      content: data.content,
      encoding: data.encoding,
      decodedContent,
    };
  }
}
