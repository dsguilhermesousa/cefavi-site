export async function onRequestGet(context) {
  const { GITHUB_CLIENT_ID } = context.env;
  const redirectUri = `https://cefavi.com.br/api/auth/callback`;
  const scope = 'repo,user';

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;

  return Response.redirect(githubAuthUrl, 302);
}
