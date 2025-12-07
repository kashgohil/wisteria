// Get your Clerk JWT issuer domain from Clerk Dashboard -> JWT Templates
// It should look like: https://your-app.clerk.accounts.dev
// IMPORTANT: You need to set CLERK_JWT_ISSUER_DOMAIN in Convex Dashboard
// Go to: https://dashboard.convex.dev -> Settings -> Environment Variables
// Add: CLERK_JWT_ISSUER_DOMAIN = https://your-clerk-domain.clerk.accounts.dev
// Find your domain in Clerk Dashboard -> Configure -> JWT Templates -> Issuer

const clerkIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;

export default {
	providers: [
		...(clerkIssuerDomain
			? [
					{
						domain: clerkIssuerDomain,
						applicationID: "convex",
					},
				]
			: []),
	],
};
