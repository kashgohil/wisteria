import { useEffect, useState } from "react";
import type { ModelInfo } from "../../../../shared/models";
import {
	LOCAL_PROVIDERS,
	PROVIDER_KEY_MAP,
	type ProviderId,
} from "../../../../shared/providers";
import type { ProviderStatus } from "../types";

export function useProviderStatuses(models: ModelInfo[]) {
	const [providerStatuses, setProviderStatuses] = useState<
		Map<ProviderId, ProviderStatus>
	>(new Map());

	useEffect(() => {
		async function checkStatuses() {
			const statuses = new Map<ProviderId, ProviderStatus>();

			for (const [providerId, keyName] of Object.entries(PROVIDER_KEY_MAP)) {
				const pid = providerId as ProviderId;

				if (LOCAL_PROVIDERS.includes(pid)) {
					const hasModels = models.some((m) => m.provider === pid);
					statuses.set(pid, hasModels ? "connected" : "unreachable");
				} else if (keyName) {
					try {
						const key = await window.wisteria.keys.get(keyName);
						statuses.set(pid, key ? "connected" : "no-api-key");
					} catch {
						statuses.set(pid, "no-api-key");
					}
				}
			}

			setProviderStatuses(statuses);
		}

		checkStatuses();
	}, [models]);

	return providerStatuses;
}
