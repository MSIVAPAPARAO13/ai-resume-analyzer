import crypto from 'node:crypto';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error-handler.js';
import { encryptToken, decryptToken } from '../../utils/crypto.js';
import { logger } from '../../utils/logger.js';
import type { IGitHubProvider, GitHubEvidence } from './github.interface.js';
import { GitHubProvider } from './github.provider.js';
import { MockGitHubProvider } from './mock-github.provider.js';
import { extractTechnologies, sanitizeMarkdown } from './tech-extractor.js';

export class GitHubService {
  private provider: IGitHubProvider;

  constructor(provider?: IGitHubProvider) {
    if (provider) {
      this.provider = provider;
    } else if (
      env.GITHUB_CLIENT_ID &&
      env.GITHUB_CLIENT_SECRET &&
      env.NODE_ENV !== 'test'
    ) {
      this.provider = new GitHubProvider();
    } else {
      // Use Mock provider in test environment or when credentials are not configured
      this.provider = new MockGitHubProvider();
    }
  }

  /**
   * Set custom provider (useful for testing)
   */
  setProvider(provider: IGitHubProvider) {
    this.provider = provider;
  }

  /**
   * Generate signed OAuth state to prevent CSRF
   */
  generateState(userId: string): string {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(8).toString('hex');
    const raw = `${userId}:${timestamp}:${nonce}`;
    const hmac = crypto
      .createHmac('sha256', env.GITHUB_ENCRYPTION_KEY || 'default-secret-state')
      .update(raw)
      .digest('hex');
    return `${Buffer.from(raw).toString('base64url')}.${hmac}`;
  }

  /**
   * Validate signed OAuth state and extract userId
   */
  validateState(state: string): { userId: string } {
    if (!state || !state.includes('.')) {
      throw new AppError('Invalid OAuth state parameter', 400, 'INVALID_STATE');
    }

    const [payloadB64, signature] = state.split('.');
    const raw = Buffer.from(payloadB64, 'base64url').toString('utf8');

    const expectedHmac = crypto
      .createHmac('sha256', env.GITHUB_ENCRYPTION_KEY || 'default-secret-state')
      .update(raw)
      .digest('hex');

    if (signature !== expectedHmac) {
      throw new AppError(
        'Tampered OAuth state parameter',
        400,
        'INVALID_STATE',
      );
    }

    const parts = raw.split(':');
    if (parts.length < 3) {
      throw new AppError('Malformed OAuth state data', 400, 'INVALID_STATE');
    }

    const [userId, timestampStr] = parts;
    const timestamp = Number(timestampStr);
    const fifteenMinutes = 15 * 60 * 1000;

    if (Date.now() - timestamp > fifteenMinutes) {
      throw new AppError(
        'OAuth state has expired. Please retry.',
        400,
        'STATE_EXPIRED',
      );
    }

    return { userId };
  }

  /**
   * Get GitHub Connect authorization URL
   */
  getConnectUrl(userId: string): { url: string; state: string } {
    const state = this.generateState(userId);
    const url = this.provider.getAuthorizationUrl(state);
    return { url, state };
  }

  /**
   * Handle GitHub OAuth callback
   */
  async handleCallback(code: string, state: string, currentUserId?: string) {
    const { userId: stateUserId } = this.validateState(state);

    const userId = currentUserId || stateUserId;
    if (currentUserId && currentUserId !== stateUserId) {
      throw new AppError(
        'OAuth state does not match authenticated user',
        403,
        'STATE_MISMATCH',
      );
    }

    // Exchange code for token
    const tokenData = await this.provider.exchangeCodeForToken(code);
    const accessToken = tokenData.accessToken;

    // Fetch user profile from GitHub
    const ghUser = await this.provider.getAuthenticatedUser(accessToken);

    // Encrypt sensitive tokens before saving
    const encryptedAccessToken = encryptToken(accessToken);
    const encryptedRefreshToken = tokenData.refreshToken
      ? encryptToken(tokenData.refreshToken)
      : null;

    const expiresAt = tokenData.expiresIn
      ? new Date(Date.now() + tokenData.expiresIn * 1000)
      : null;

    // Upsert connection
    const connection = await prisma.gitHubConnection.upsert({
      where: { userId },
      update: {
        githubUserId: String(ghUser.id),
        username: ghUser.login,
        avatarUrl: ghUser.avatar_url,
        accessTokenEncrypted: encryptedAccessToken,
        refreshTokenEncrypted: encryptedRefreshToken,
        accessTokenExpiresAt: expiresAt,
      },
      create: {
        userId,
        githubUserId: String(ghUser.id),
        username: ghUser.login,
        avatarUrl: ghUser.avatar_url,
        accessTokenEncrypted: encryptedAccessToken,
        refreshTokenEncrypted: encryptedRefreshToken,
        accessTokenExpiresAt: expiresAt,
      },
    });

    // Initial sync of repositories
    try {
      await this.syncRepositories(userId, accessToken);
    } catch (syncErr) {
      logger.warn({ syncErr }, 'Initial GitHub repository sync had issues');
    }

    return {
      connected: true,
      username: connection.username,
      avatarUrl: connection.avatarUrl,
    };
  }

  /**
   * Get user's connection status (without exposing secrets)
   */
  async getConnectionStatus(userId: string) {
    const conn = await prisma.gitHubConnection.findUnique({
      where: { userId },
    });

    if (!conn) {
      return { connected: false };
    }

    const repoCount = await prisma.gitHubRepository.count({
      where: { userId },
    });

    return {
      connected: true,
      username: conn.username,
      avatarUrl: conn.avatarUrl,
      repositoryCount: repoCount,
      connectedAt: conn.createdAt,
      lastUpdatedAt: conn.updatedAt,
    };
  }

  /**
   * Disconnect GitHub and clear repositories
   */
  async disconnect(userId: string) {
    await prisma.gitHubRepository.deleteMany({
      where: { userId },
    });

    await prisma.gitHubConnection.deleteMany({
      where: { userId },
    });

    return { success: true };
  }

  /**
   * Helper to retrieve decrypted user access token
   */
  private async getDecryptedToken(userId: string): Promise<string> {
    const conn = await prisma.gitHubConnection.findUnique({
      where: { userId },
    });

    if (!conn || !conn.accessTokenEncrypted) {
      throw new AppError(
        'GitHub account is not connected',
        400,
        'GITHUB_NOT_CONNECTED',
      );
    }

    try {
      return decryptToken(conn.accessTokenEncrypted);
    } catch (err) {
      logger.error({ err }, 'Failed to decrypt GitHub access token');
      throw new AppError(
        'Failed to decrypt stored credentials. Please reconnect GitHub.',
        500,
        'DECRYPTION_FAILED',
      );
    }
  }

  /**
   * Sync and cache repositories from GitHub
   */
  async syncRepositories(
    userId: string,
    explicitToken?: string,
  ): Promise<any[]> {
    const token = explicitToken || (await this.getDecryptedToken(userId));
    const repos = await this.provider.listRepositories(token);

    for (const r of repos) {
      await prisma.gitHubRepository.upsert({
        where: {
          userId_githubRepositoryId: {
            userId,
            githubRepositoryId: String(r.id),
          },
        },
        update: {
          name: r.name,
          fullName: r.full_name,
          description: r.description,
          htmlUrl: r.html_url,
          defaultBranch: r.default_branch,
          language: r.language,
          stars: r.stargazers_count,
          forks: r.forks_count,
          isPrivate: r.private,
          topics: r.topics || [],
          lastPushedAt: r.pushed_at ? new Date(r.pushed_at) : null,
        },
        create: {
          userId,
          githubRepositoryId: String(r.id),
          name: r.name,
          fullName: r.full_name,
          description: r.description,
          htmlUrl: r.html_url,
          defaultBranch: r.default_branch,
          language: r.language,
          stars: r.stargazers_count,
          forks: r.forks_count,
          isPrivate: r.private,
          topics: r.topics || [],
          lastPushedAt: r.pushed_at ? new Date(r.pushed_at) : null,
        },
      });
    }

    return this.getRepositories(userId, false);
  }

  /**
   * List repositories for user
   */
  async getRepositories(userId: string, refresh = false): Promise<any[]> {
    if (refresh) {
      return this.syncRepositories(userId);
    }

    const cached = await prisma.gitHubRepository.findMany({
      where: { userId },
      orderBy: [{ stars: 'desc' }, { updatedAt: 'desc' }],
    });

    if (cached.length === 0) {
      const conn = await prisma.gitHubConnection.findUnique({
        where: { userId },
      });
      if (conn) {
        return this.syncRepositories(userId);
      }
    }

    return cached;
  }

  /**
   * Get single repository details
   */
  async getRepository(userId: string, repoId: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        repoId,
      );

    const repo = await prisma.gitHubRepository.findFirst({
      where: {
        userId,
        OR: [
          ...(isUuid ? [{ id: repoId }] : []),
          { githubRepositoryId: repoId },
          { name: repoId },
        ],
      },
    });

    if (!repo) {
      throw new AppError('Repository not found', 404, 'NOT_FOUND');
    }

    return repo;
  }

  /**
   * Get repository languages
   */
  async getRepositoryLanguages(userId: string, repoId: string) {
    const repo = await this.getRepository(userId, repoId);

    // If languages already cached in database, return them
    if (
      repo.languages &&
      typeof repo.languages === 'object' &&
      Object.keys(repo.languages).length > 0
    ) {
      return repo.languages as Record<string, number>;
    }

    const token = await this.getDecryptedToken(userId);
    const [owner, name] = repo.fullName.split('/');

    const languages = await this.provider.getRepositoryLanguages(
      token,
      owner,
      name,
    );

    // Cache languages
    await prisma.gitHubRepository.update({
      where: { id: repo.id },
      data: { languages },
    });

    return languages;
  }

  /**
   * Get repository README with technology extraction and XSS sanitization
   */
  async getRepositoryReadme(userId: string, repoId: string) {
    const repo = await this.getRepository(userId, repoId);
    const token = await this.getDecryptedToken(userId);
    const [owner, name] = repo.fullName.split('/');

    let readmeData: { decodedContent: string };
    try {
      readmeData = await this.provider.getRepositoryReadme(token, owner, name);
    } catch {
      return {
        readme: '',
        detectedTechnologies: repo.language ? [repo.language] : [],
        error: 'No README found in this repository',
      };
    }

    const sanitizedReadme = sanitizeMarkdown(readmeData.decodedContent);
    const languages = repo.language ? [repo.language] : [];
    const topics = repo.topics || [];
    const detectedTechnologies = extractTechnologies(
      readmeData.decodedContent,
      languages,
      topics,
    );

    return {
      readme: sanitizedReadme,
      detectedTechnologies,
    };
  }

  /**
   * Import GitHub repository into Career Twin (requires explicit user confirmation)
   */
  async importToCareerTwin(
    userId: string,
    repoId: string,
    projectData?: {
      name?: string;
      description?: string;
      technologies?: string[];
      projectUrl?: string;
      repoUrl?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const repo = await this.getRepository(userId, repoId);

    // Ensure Career Profile exists
    let profile = await prisma.careerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.careerProfile.create({
        data: { userId },
      });
    }

    // Determine technologies
    let technologies = projectData?.technologies;
    if (!technologies || technologies.length === 0) {
      const readmeInfo = await this.getRepositoryReadme(userId, repoId);
      technologies = readmeInfo.detectedTechnologies;
    }

    const name = projectData?.name || repo.name;
    const description =
      projectData?.description ||
      repo.description ||
      `GitHub project: ${repo.fullName}`;
    const repoUrl = projectData?.repoUrl || repo.htmlUrl;
    const projectUrl = projectData?.projectUrl || null;
    const startDate = projectData?.startDate
      ? new Date(projectData.startDate)
      : null;
    const endDate = projectData?.endDate ? new Date(projectData.endDate) : null;

    // Create the project in CareerProfile
    const project = await prisma.project.create({
      data: {
        careerProfileId: profile.id,
        name,
        description,
        technologies,
        projectUrl,
        repoUrl,
        startDate,
        endDate,
      },
    });

    return {
      project,
      source: 'GITHUB',
      status: 'VERIFIED_USER_DATA', // Now user-confirmed in Career Twin
    };
  }

  /**
   * Extract structured GitHub evidence for Evidence Guard
   */
  async getEvidence(userId: string): Promise<GitHubEvidence[]> {
    const repos = await prisma.gitHubRepository.findMany({
      where: { userId },
    });

    const evidences: GitHubEvidence[] = [];

    for (const r of repos) {
      const detected = extractTechnologies(
        '',
        r.language ? [r.language] : [],
        r.topics || [],
      );

      evidences.push({
        source: 'GITHUB',
        evidenceType: 'REPOSITORY',
        repositoryName: r.name,
        repositoryUrl: r.htmlUrl,
        claim: `Repository "${r.name}" (${r.fullName}) with ${r.stars} stars`,
        detectedTechnologies: detected,
        status: 'EXTERNAL_SOURCE',
        lastActivityDate: r.lastPushedAt?.toISOString() || null,
      });
    }

    return evidences;
  }
}

export const gitHubService = new GitHubService();
