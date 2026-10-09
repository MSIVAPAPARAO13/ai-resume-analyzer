export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  bio?: string | null;
}

export interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
  topics?: string[];
  pushed_at: string | null;
}

export interface GitHubReadmeResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: string;
  content: string;
  encoding: string;
}

export interface GitHubEvidence {
  source: 'GITHUB';
  evidenceType: 'REPOSITORY' | 'LANGUAGE' | 'TOPIC' | 'README_TECH';
  repositoryName: string;
  repositoryUrl: string;
  claim: string;
  detectedTechnologies: string[];
  status: 'EXTERNAL_SOURCE';
  lastActivityDate?: string | null;
}

export interface IGitHubProvider {
  getAuthorizationUrl(state: string): string;
  exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }>;
  getAuthenticatedUser(accessToken: string): Promise<GitHubUser>;
  listRepositories(
    accessToken: string,
    page?: number,
    perPage?: number,
  ): Promise<GitHubRepoResponse[]>;
  getRepository(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<GitHubRepoResponse>;
  getRepositoryLanguages(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<Record<string, number>>;
  getRepositoryReadme(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<{ content: string; encoding: string; decodedContent: string }>;
}
