export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── Rota: iniciar autenticação OAuth GitHub ──
    if (url.pathname === '/api/auth') {
      const redirectUri = `https://cefavi.com.br/api/auth/callback`;
      const scope = 'repo,user';
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
      return Response.redirect(githubAuthUrl, 302);
    }

    // ── Rota: callback OAuth GitHub ──
    if (url.pathname === '/api/auth/callback') {
      const code = url.searchParams.get('code');

      if (!code) {
        return new Response('Código de autorização não encontrado.', { status: 400 });
      }

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        return new Response(`Erro: ${tokenData.error_description}`, { status: 400 });
      }

      const token = tokenData.access_token;
      const provider = 'github';

      const html = `<!DOCTYPE html>
<html>
<head><title>Autenticando...</title></head>
<body>
<script>
(function() {
  function receiveMessage(e) {
    window.opener.postMessage(
      'authorization:${provider}:success:' + JSON.stringify({ token: '${token}', provider: '${provider}' }),
      e.origin
    );
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:${provider}", "*");
})();
</script>
<p>Autenticação concluída. Pode fechar esta janela.</p>
</body>
</html>`;

      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // ── Todas as outras rotas: serve assets estáticos ──
    return env.ASSETS.fetch(request);
  },
};
