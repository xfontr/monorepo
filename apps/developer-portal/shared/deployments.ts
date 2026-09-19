export interface Deployment {
    id: number
    environment: string
}

export interface DeploymentStatus {
    state: "error" | "failure" | "inactive" | "in_progress" | "pending" | "queued" | "success"
    environment_url: string | null
    created_at: string
}

export interface EnvironmentDeployment {
    environment: string
    state: DeploymentStatus["state"]
    url: string | null
    updatedAt: string
}

export function deploymentUrlFor(deployments: EnvironmentDeployment[], environment: string): string | undefined {
    return deployments.find((deployment) => deployment.environment === environment && deployment.url)?.url ?? undefined;
}

/** The deployments endpoint shares the issues page's unauthenticated, browser-side GitHub read. */
export function deploymentsApiUrl(repoUrl: string): string | null {
    let url: URL;

    try {
        url = new URL(repoUrl);
    }
    catch {
        return null;
    }

    const [owner, repo] = url.pathname.split("/").filter(Boolean);

    if (owner === undefined || repo === undefined) return null;

    return `${url.protocol}//api.${url.host}/repos/${owner}/${repo.replace(/\.git$/, "")}/deployments`;
}

/** GitHub returns newest first; one current status per environment prevents stale deploys winning. */
export function latestDeployments(
    deployments: Deployment[],
    statuses: Map<number, DeploymentStatus[]>,
): EnvironmentDeployment[] {
    const environments = new Map<string, EnvironmentDeployment>();

    for (const deployment of deployments) {
        if (environments.has(deployment.environment)) continue;

        const [status] = statuses.get(deployment.id) ?? [];

        if (!status) continue;

        environments.set(deployment.environment, {
            environment: deployment.environment,
            state: status.state,
            url: status.environment_url,
            updatedAt: status.created_at,
        });
    }

    return [...environments.values()].sort((a, b) => a.environment.localeCompare(b.environment));
}
