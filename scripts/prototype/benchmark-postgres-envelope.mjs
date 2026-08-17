const target =
	process.env.PROTOTYPE_URL ??
	'https://signal-web-app-prototype.vercel.app/api/prototype/postgres-envelope';
const token = process.env.PROTOTYPE_BENCHMARK_TOKEN;

if (!token) {
	throw new Error('PROTOTYPE_BENCHMARK_TOKEN is required');
}

const percentile = (values, fraction) => {
	const sorted = [...values].sort((left, right) => left - right);
	return sorted[Math.ceil(sorted.length * fraction) - 1];
};

const request = async (concurrency = 1) => {
	const startedAt = performance.now();
	const response = await fetch(`${target}?concurrency=${concurrency}`, {
		headers: { authorization: `Bearer ${token}` }
	});
	const body = await response.json();

	return {
		status: response.status,
		requestMs: Number((performance.now() - startedAt).toFixed(2)),
		...body
	};
};

const summarize = (responses) => ({
	requests: responses.length,
	statuses: [...new Set(responses.map(({ status }) => status))],
	regions: [...new Set(responses.map(({ region }) => region))],
	instances: new Set(responses.map(({ instanceId }) => instanceId)).size,
	failures: responses.reduce(
		(sum, response) => sum + (Array.isArray(response.failures) ? response.failures.length : 1),
		0
	),
	requestP50Ms: percentile(
		responses.map(({ requestMs }) => requestMs),
		0.5
	),
	requestP95Ms: percentile(
		responses.map(({ requestMs }) => requestMs),
		0.95
	),
	maxPoolTotal: Math.max(...responses.map(({ pool }) => pool?.peak?.total ?? pool?.total ?? 0)),
	maxPoolWaiting: Math.max(
		...responses.map(({ pool }) => pool?.peak?.waiting ?? pool?.waiting ?? 0)
	),
	maxOwnConnections: Math.max(...responses.map(({ pool }) => pool?.observedOwnConnections ?? 0))
});

const warm = await request();
const intraRequest = await request(16);
const bursts = {};

for (const size of [1, 4, 8, 16, 32]) {
	bursts[size] = summarize(await Promise.all(Array.from({ length: size }, () => request())));
}

console.log(
	JSON.stringify(
		{
			warm: summarize([warm]),
			intraRequest: summarize([intraRequest]),
			bursts
		},
		null,
		2
	)
);
