export async function onRequestGet(context) {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = context.env;
  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Código de autorização não encontrado.', { status: 400 });
  }

  // Troca o código pelo token de acesso
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return new Response(`Erro de autenticação: ${tokenData.error_description}`, { status: 400 });
  }

  const token = tokenData.access_token;
  const provider = 'github';

  // Retorna HTML que envia o token para o Decap CMS via postMessage
  const html = `
<!DOCTYPE html>
<html>
<head><title>Autenticando...</title></head>
<body>
<script>
  (function() {
    function receiveMessage(e) {
      console.log("receiveMessage %o", e);
      window.opener.postMessage(
        'authorization:${provider}:success:${JSON.stringify({ token, provider })}',
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
