import { deploymentsApiUrl, latestDeployments, type Deployment, type DeploymentStatus, type EnvironmentDeployment } from "#shared/deployments.ts";

interface DeploymentsResponse {
    deployments: EnvironmentDeployment[]
    error: string | null
}

/** Reads live deploy state in the browser: a static build cannot know what happened after it shipped. */
export function useDeployments() {
    const { public: { repoUrl } } = useRuntimeConfig();

    return useAsyncData<DeploymentsResponse>("deployments", async () => {
        const endpoint = deploymentsApiUrl(repoUrl);

        if (!endpoint) return { deployments: [], error: "NUXT_PUBLIC_REPO_URL does not name a repository." };

        try {
            const deployments = await $fetch<Deployment[]>(endpoint);
            const newest = new Map<string, Deployment>();

            for (const deployment of deployments) {
                if (!newest.has(deployment.environment)) newest.set(deployment.environment, deployment);
            }

            const statuses = new Map(await Promise.all([...newest.values()].map(async (deployment) => [
                deployment.id,
                await $fetch<DeploymentStatus[]>(`${endpoint}/${deployment.id}/statuses`),
            ] as const)));

            return { deployments: latestDeployments(deployments, statuses), error: null };
        }
        catch (cause) {
            return {
                deployments: [],
                error: cause instanceof Error ? cause.message : "GitHub deployments could not be read.",
            };
        }
    }, { server: false, default: () => ({ deployments: [], error: null }) });
}
